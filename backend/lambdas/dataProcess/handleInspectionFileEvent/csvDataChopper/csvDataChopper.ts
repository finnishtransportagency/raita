import { ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import { Raportti } from './db/model/Raportti';
import { getDBConnection } from './db/dbUtil';
import { Readable } from 'stream';
import * as readline from 'readline';
import { KeyData } from '../../../utils';
import { getLambdaConfigOrFail } from '../handleInspectionFileEvent';
import {
  readRunningDateFromLine,
  replaceSeparators,
  replaceSeparatorsInHeaderLine,
  tidyUpFileBody,
  tidyUpHeaderLine,
} from '../../csvUtils/csvConversionUtils';
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

async function updateRaporttiStatus(
  id: number,
  status: string,
  error: null | string,
) {
  let { schema, sql } = await getDBConnection();
  let errorSubstring = error;
  if (error) {
    errorSubstring = error.substring(0, 1000);
  }
  try {
    const a = await sql`UPDATE ${sql(
      schema,
    )}.raportti SET status = ${status}, error = ${errorSubstring} WHERE id = ${id};`;
    log.info(a);
  } catch (e) {
    log.error('Error updating raportti status');
    log.error(e);
    throw e;
  }
}

//metadata isn't inserterd yet; metadata is available only after streaming thu file; todo insert metadata in backend/lambdas/dataProcess/handleCSVFileEvent
export async function insertRaporttiData(
  fileBaseName: string,
  fileNamePrefix: string,
  metadata: ParseValueResult | null,
  aloitus_rata_kilometri: number | null,
  kampanja: string | null,
  lopetus_rata_kilometri: number | null,
  raide_numero: number | null,
  raportin_kategoria: string | null,
  raportointiosuus: string | null,
  rataosuus_numero: string | null,
  tarkastusajon_tunniste: string | null,
  tarkastusvaunu: string | null,
  tiedoston_koko_kb: string | null,
  tiedostonimi: string | null,
  tiedostotyyppi: string | null,
): Promise<number> {
  const data: Raportti = {
    aloitus_rata_kilometri,
    kampanja,
    lopetus_rata_kilometri,
    raide_numero,
    raportin_kategoria,
    raportointiosuus,
    rataosuus_numero,
    tarkastusajon_tunniste,
    tarkastusvaunu,
    tiedoston_koko_kb,
    tiedostonimi,
    tiedostotyyppi,
    zip_tiedostonimi: fileBaseName,
    zip_vastaanotto_pvm: new Date(),
    zip_vastaanotto_vuosi: new Date(),
    pvm: new Date(),
    vuosi: new Date(),
    jarjestelma: fileNamePrefix,
  };

  let { schema, sql } = await getDBConnection();

  try {
    const [id] = await sql`INSERT INTO ${sql(schema)}.raportti ${sql(
      data,
    )} returning id`;
    log.info(id);
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

  const outFileName = 'chunkFile_'+ reportId + '_'+ chunkNumber + '_'+ key.fileName;

  log.info('outFileName ' + outFileName);

  const config = getLambdaConfigOrFail();

  log.info('config.targetBucketName' + config.inspectionBucket);

  const command = new PutObjectCommand({
    Bucket: config.csvBucket,
    Key: outFileName,
    ContentType: 'txt',
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
    log.info("prefix ok " + fileNamePrefix);
  } else {
    log.warn('Unknown csv file prefix: ' + fileNamePrefix);
    throw new Error('Unknown csv file prefix:');
  }
}

//chop csv file into 50000 row chunks; add header line to each chunk; write each chunk as a file in CSV S3 bucket
export async function chopCSVFileStream(
  keyData: KeyData,
  fileStream: Readable,
  metadata: ParseValueResult | null,
) {
  const fileBaseName = keyData.fileBaseName;
  const fileNameParts = fileBaseName.split('_');
  const fileNamePrefix = fileNameParts[0];
  const jarjestelma = fileNamePrefix.toUpperCase();
  const reportId: number = await insertRaporttiData(
    fileBaseName,
    fileNamePrefix,
    metadata,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  );
  log.info('reportId: ' + reportId);
  checkFilenamePrefix(jarjestelma);

  try {
    let runningDate = new Date();
    let csvHeaderLine = '';

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineBuffer: string[] = [];
    const maxBufferSize = 500;

    let state = ReadState.READING_HEADER as ReadState;

    let lineCounter = 0;
    let handleCounter = 0;

    const myReadPromise = new Promise<void>((resolve, reject) => {
      rl.on('line', async line => {
        lineBuffer.push(line);
        lineCounter++;


        //TODO validate fist chunk or smaller so we dont chop invalid file

        //running date on the firstline unless it's missing; then csv column headers on the first line
        if (state == ReadState.READING_HEADER && lineBuffer.length === 1) {
          if (lineBuffer[0].search('Running Date') != -1) {
            runningDate = readRunningDateFromLine(lineBuffer[0]);
            log.info('runningdate set: ' + runningDate);
          } else {
            csvHeaderLine = lineBuffer[0];
            state = ReadState.READING_BODY;
            lineBuffer = [];
            log.info('csvHeaderLine set 0: ' + csvHeaderLine);
          }
        }

        //csv column headers on the second line when running date was found on the first
        if (state == ReadState.READING_HEADER && lineBuffer.length === 2) {
          csvHeaderLine = lineBuffer[1];
          state = ReadState.READING_BODY;
          lineBuffer = [];
          log.info('csvHeaderLine set: ' + csvHeaderLine);
        }

        //read body lines as maxBufferSize chunks, put column headers at beginning on each chunk so zod-csv can handle them
        if (state == ReadState.READING_BODY) {
          if (lineBuffer.length > maxBufferSize) {
            rl.pause();

            handleCounter++;
            //  log.info("handle bufferd: " + handleCounter + " line counter: " + lineCounter);
            const bufferCopy = lineBuffer.slice();
            lineBuffer = [];
            rl.resume();
            log.info('keyData.keyWithoutSuffix: ' + keyData.keyWithoutSuffix);
            await writeFileChunkToQueueS3(
              csvHeaderLine.concat('\r\n').concat(bufferCopy.join('\r\n')),
              runningDate,
              reportId,
              keyData,
              handleCounter,
            );
            //  log.info("handled bufferd: " + handleCounter);
          }
        }
      });
      rl.on('error', () => {
        log.warn('error ');
      });
      rl.on('close', function () {
        log.info('closed');
        resolve();
      });
    });

    try {
      log.info('await myReadPromise' );
      await myReadPromise;
      log.info('awaited myReadPromise' );
    } catch (err) {
      log.warn('an error has occurred ' + err);
    }

    log.info('Reading file line by line with readline done.' + lineCounter);

    // Last content of lineBuffer not handled yet
    log.info('buffer lines to write: ' + lineBuffer.length + state);
    if (state == ReadState.READING_BODY && lineBuffer.length) {
      await writeFileChunkToQueueS3(
        csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
        runningDate,
        reportId,
        keyData,
        handleCounter,
      );
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    log.info(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    log.info('Wrote files to csv bucket ' + fileBaseName + ' ' + handleCounter);
    await updateRaporttiStatus(reportId, 'SUCCESS', null);
    log.info('HEllo suscses done');
    return 'success';
  } catch (e) {
    log.warn('csv parsing error ' + e.toString());
    await updateRaporttiStatus(reportId, 'ERROR', e.toString());
    return 'error';
  }
}
