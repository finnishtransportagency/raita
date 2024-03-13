import { ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import { Raportti } from '../../csvCommon/db/model/Raportti';
import {
  getDBConnection,
  updateRaporttiChunks,
  updateRaporttiStatus,
} from '../../csvCommon/db/dbUtil';
import { Readable } from 'stream';
import * as readline from 'readline';
import { KeyData } from '../../../utils';
import { readRunningDateFromLine } from '../../csvCommon/csvConversionUtils';
import { getLambdaConfigOrFail } from '../handleInspectionFileEvent';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

//metadata isn't inserted yet; metadata is available only after streaming thu file; todo insert metadata in backend/lambdas/dataProcess/handleCSVFileEvent
export async function insertRaporttiData(
  key: string,
  fileBaseName: string,
  fileNamePrefix: string,
  metadata: ParseValueResult | null,
  status: string | null,
): Promise<number> {
  const data: Raportti = {
    key,
    status,
    file_name: fileBaseName,
    system: fileNamePrefix,
    chunks_to_process: -1,
    events: null,
  };

  let { schema, sql } = await getDBConnection();

  try {
    const [id] = await sql`INSERT INTO ${sql(schema)}.raportti ${sql(
      data,
    )} returning id`;
    log.debug(id);
    return id.id;
  } catch (e) {
    log.error('Error inserting raportti data');
    log.error(e);
    throw e;
  }
}

async function writeFileChunkToQueueS3(
  inputFileChunkBody: string,
  runningDate: Date,
  reportId: number,
  key: KeyData,
  chunkNumber: number,
) {
  console.log('writeFileChunkToQueueS3 key ' + key);
  console.log('writeFileChunkToQueueS3 report id ' + reportId);
  console.log('writeFileChunkToQueueS3 chunknumber' + chunkNumber);

  const outFileName =
    'chunkFile_' + reportId + '_' + chunkNumber + '_' + key.fileName;

  log.debug('outFileName ' + outFileName);

  const config = getLambdaConfigOrFail();

  log.debug('config.targetBucketName' + config.inspectionBucket);

  const command = new PutObjectCommand({
    Bucket: config.csvBucket,
    Key: outFileName,
    ContentType: 'text/csv',
    Body: Buffer.from(inputFileChunkBody),
  });
  const s3Client = new S3Client({});
  await s3Client.send(command);

  return;
}

enum ReadState {
  READING_HEADER = 'READING_HEADER',
  READING_BODY = 'READING_BODY',
}
const allowedPrefixes = ['AMS', 'OHL', 'PI', 'RC', 'RP', 'TG', 'TSIGHT'];

async function checkFilenamePrefix(fileNamePrefix: string) {
  if (allowedPrefixes.find(s => s === fileNamePrefix)) {
    log.debug('prefix ok ' + fileNamePrefix);
  } else {
    log.warn('Unknown csv file prefix: ' + fileNamePrefix);
    throw new Error('Unknown csv file prefix:');
  }
}

//chop csv file into 50000 row chunks; add header line to each chunk; write each chunk as a file in CSV S3 bucket
export async function chopCSVFileStream(
  keyData: KeyData,
  fileStream: Readable,
) {
  const fileBaseName = keyData.fileBaseName;
  const fileNameParts = fileBaseName.split('_');
  const fileNamePrefix = fileNameParts[0];
  const jarjestelma = fileNamePrefix.toUpperCase();
  const reportId: number = await insertRaporttiData(
    keyData.keyWithoutSuffix,
    fileBaseName,
    fileNamePrefix,
    null,
    'CHOPPING',
  );
  log.debug('reportId: ' + reportId);
  checkFilenamePrefix(jarjestelma);

  try {
    let runningDate = new Date();
    let csvHeaderLine = '';

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineBuffer: string[] = [];
    const maxBufferSize = 50000;

    let state = ReadState.READING_HEADER as ReadState;

    let lineCounter = 0;
    let chunkCounter = 0;

    const myReadPromise = new Promise<void>((resolve, reject) => {
      rl.on('line', async line => {
        lineBuffer.push(line);
        lineCounter++;

        //TODO validate fist chunk or smaller so we dont chop invalid file

        //running date on the firstline unless it's missing; then csv column headers on the first line
        if (state == ReadState.READING_HEADER && lineBuffer.length === 1) {
          if (lineBuffer[0].search('Running Date') != -1) {
            runningDate = readRunningDateFromLine(lineBuffer[0]);
            log.debug('runningdate set: ' + runningDate);
          } else {
            csvHeaderLine = lineBuffer[0];
            state = ReadState.READING_BODY;
            lineBuffer = [];
            log.debug('csvHeaderLine set 0: ' + csvHeaderLine);
          }
        }

        //csv column headers on the second line when running date was found on the first
        if (state == ReadState.READING_HEADER && lineBuffer.length === 2) {
          csvHeaderLine = lineBuffer[1];
          state = ReadState.READING_BODY;
          lineBuffer = [];
          log.debug('csvHeaderLine set: ' + csvHeaderLine);
        }

        //read body lines as maxBufferSize chunks, put column headers at beginning on each chunk so zod-csv can handle them
        if (state == ReadState.READING_BODY) {
          if (lineBuffer.length > maxBufferSize) {
            rl.pause();

            chunkCounter++;
            //  log.debug("handle bufferd: " + handleCounter + " line counter: " + lineCounter);
            const bufferCopy = lineBuffer.slice();
            lineBuffer = [];
            rl.resume();
            log.debug('keyData.keyWithoutSuffix: ' + keyData.keyWithoutSuffix);
            await writeFileChunkToQueueS3(
              csvHeaderLine.concat('\r\n').concat(bufferCopy.join('\r\n')),
              runningDate,
              reportId,
              keyData,
              chunkCounter,
            );
            //  log.debug("handled bufferd: " + handleCounter);
          }
        }
      });
      rl.on('error', () => {
        log.warn('error ');
      });
      rl.on('close', function () {
        log.debug('closed');
        resolve();
      });
    });

    try {
      log.debug('await myReadPromise');
      await myReadPromise;
      log.debug('awaited myReadPromise');
    } catch (err) {
      log.warn('an error has occurred ' + err);
    }

    log.debug('Reading file line by line with readline done.' + lineCounter);

    // Last content of lineBuffer not handled yet
    log.debug('buffer lines to write: ' + lineBuffer.length + state);
    if (state == ReadState.READING_BODY && lineBuffer.length) {
      chunkCounter++;
      await writeFileChunkToQueueS3(
        csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
        runningDate,
        reportId,
        keyData,
        chunkCounter,
      );
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    log.debug(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    log.debug('Wrote files to csv bucket ' + fileBaseName + ' ' + chunkCounter);
    await updateRaporttiStatus(reportId, 'PARSING', null);
    updateRaporttiChunks(reportId, chunkCounter);
    log.debug('Chopped file successfully: ' + fileBaseName);
    return reportId;
  } catch (e) {
    log.warn('csv chopping error ' + e.toString());
    await updateRaporttiStatus(reportId, 'ERROR', e.toString());
    return -1;
  }
}
