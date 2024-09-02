import { log } from '../../../../utils/logger';
import {
  DBConnection,
  emptyRaporttiMittausRows,
  updateRaporttiChunks,
  updateRaporttiStatus,
} from '../../csvCommon/db/dbUtil';
import { Readable } from 'stream';
import * as readline from 'readline';
import { KeyData } from '../../../utils';
import { readRunningDateFromLine } from '../../csvCommon/csvConversionUtils';
import { getLambdaConfigOrFail } from '../handleInspectionFileEvent';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { IAdminLogger } from '../../../../utils/adminLog/types';
import { PostgresLogger } from '../../../../utils/adminLog/postgresLogger';

const adminLogger: IAdminLogger = new PostgresLogger();

async function writeFileChunkToQueueS3(
  inputFileChunkBody: string,
  reportId: number,
  key: KeyData,
  chunkNumber: number,
  invocationId: string,
) {
  try {
    await adminLogger.init('data-csv-mass-import', key.keyWithoutSuffix);
    const pathString = key.path.slice(0, key.path.length - 1).join('/');
    const outFileName =
      pathString +
      '/chunkFile_' +
      reportId +
      '_' +
      chunkNumber +
      '_' +
      key.fileName;

    log.info('outFileName ' + outFileName);

    const config = getLambdaConfigOrFail();

    log.debug('config.targetBucketName' + config.inspectionBucket);

    const newFileMetadata: { [key: string]: string } = {};
    newFileMetadata['invocation-id'] = encodeURIComponent(invocationId); // pass same invocationId to extracted files for logging

    const command = new PutObjectCommand({
      Bucket: config.csvBucket,
      Key: outFileName,
      ContentType: 'text/csv',
      Body: Buffer.from(inputFileChunkBody),
      Metadata: newFileMetadata,
    });
    const s3Client = new S3Client({});
    const putObjectCommandOutput = await s3Client.send(command);
    log.info('PutObjectCommand output');
    log.info(putObjectCommandOutput);
  } catch (e) {
    log.error('Error in writeFileChunkToQueueS3');
    adminLogger.error('Error in writeFileChunkToQueueS3');
    throw e;
  }
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
  originalKeyData: KeyData,
  fileStream: Readable,
  dbConnection: DBConnection,
  reportId: number,
  invocationId: string,
) {
  // Empty relevant mittaus rows, prevents duplication when file has been parsed before
  // note: if another parsing process of the same file is happening at the same time for some reason, result can be messy
  await emptyRaporttiMittausRows(reportId, dbConnection);
  await updateRaporttiStatus(reportId, 'CHOPPING', null, dbConnection);

  log.debug('reportId: ' + reportId);

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

            await writeFileChunkToQueueS3(
              csvHeaderLine.concat('\r\n').concat(bufferCopy.join('\r\n')),
              reportId,
              originalKeyData,
              chunkCounter,
              invocationId,
            );
            //  log.debug("handled bufferd: " + handleCounter);
          }
        }
      });
      rl.on('error', () => {
        log.error('readline error ' + originalKeyData.keyWithoutSuffix);
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
        reportId,
        originalKeyData,
        chunkCounter,
        invocationId,
      );
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    log.debug(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    log.debug(
      'Wrote files to csv bucket ' +
        originalKeyData.fileBaseName +
        ' ' +
        chunkCounter,
    );
    await updateRaporttiStatus(reportId, 'PARSING', null, dbConnection);
    updateRaporttiChunks(reportId, chunkCounter, dbConnection);
    log.debug('Chopped file successfully: ' + originalKeyData.fileBaseName);
    return true;
  } catch (e) {
    log.warn('csv chopping error ' + e.toString());
    await updateRaporttiStatus(reportId, 'ERROR', e.toString(), dbConnection);
    return false;
  }
}
