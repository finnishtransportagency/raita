import { ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import { Raportti } from './db/model/Raportti';
import { convertToDBRow, getDBConnection, writeRowsToDB } from './db/dbUtil';
import { ohlSchema } from './csvSchemas/ohlCsvSchema';
import { amsSchema } from './csvSchemas/amsCsvSchema';
import { piSchema } from './csvSchemas/piCsvSchema';
import { rcSchema } from './csvSchemas/rcCsvSchema';
import { rpSchema } from './csvSchemas/rpCsvSchema';
import { tgSchema } from './csvSchemas/tgCsvSchema';
import { tsightSchema } from './csvSchemas/tsightCsvSchema';
import { ZodObject } from 'zod';
import {
  readRunningDateFromLine,
  replaceSeparators,
  tidyUpFileBody,
} from '../../csvUtils/csvConversionUtils';
import { parseCSVContent } from '../../../../utils/zod-csv/csv';
import { Readable } from 'stream';
import * as readline from 'readline';
import { KeyData } from '../../../utils';

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

//todo get all needed values from metadata
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

async function writeCsvContentToDb(dbRows: any[], table: string) {
  const result: number = await writeRowsToDB(dbRows, table);

  return result;
}

let tidyCumu = 0;
let parseCumu = 0;
let dbCumu = 0;

async function parseCsvData(csvFileBody: string, csvSchema: ZodObject<any>) {
  const tidyBegin = Date.now();
  const tidyedFileBody = tidyUpFileBody(csvFileBody);
  const tidyEnd = Date.now();
  tidyCumu += tidyEnd - tidyBegin;
  //log.info('tidyedFileBody: ' + tidyedFileBody.substring(0, 600));
  const parseBegin = Date.now();
  const parsedCSVContent = parseCSVContent(tidyedFileBody, csvSchema);
  const parseEnd = Date.now();
  parseCumu += parseEnd - parseBegin;
  console.log('tidy: ' + tidyCumu);
  console.log('parse: ' + parseCumu);
  return { ...parsedCSVContent };
}

async function parseCsvAndWriteToDb(
  fileBody: string,
  runningDate: Date,
  reportId: number,
  fileBaseName: string,
  table: string,
  csvSchema: ZodObject<any>,
  fileNamePrefix: string,
) {
  const parsedCSVContent = await parseCsvData(fileBody, csvSchema);
  if (parsedCSVContent.success) {
    const dbRows: any[] = [];
    parsedCSVContent.validRows.forEach((row: any) =>
      dbRows.push(convertToDBRow(row, runningDate, reportId, fileNamePrefix)),
    );
    const dbBegin = Date.now();
    const a = await writeCsvContentToDb(dbRows, table);
    const dbEnd = Date.now();
    dbCumu += dbEnd - dbBegin;
    log.info('dbcumu ' + dbCumu);
    return a;
  } else {
    const errors = parsedCSVContent.errors;
    let errorsOutString = '';

    const headerErrors = errors.header;
    errorsOutString += JSON.stringify(headerErrors);

    const rowErrors = errors.rows;
    if (rowErrors) {
      const rowKeys = Object.keys(rowErrors);
      // log.info(rowKeys);
      rowKeys.forEach(key => {
        errorsOutString += key + ':';
        errorsOutString += JSON.stringify(rowErrors[key].issues);
      });
    }

    log.warn(errorsOutString);
    throw Error(
      'Error parsing CSV-file ' + fileBaseName + ' ' + errorsOutString,
    );
  }
}

enum ReadState {
  READING_HEADER = 'READING_HEADER',
  READING_BODY = 'READING_BODY',
}

async function handleBufferedLines(
  inputFileChunkBody: string,
  fileNamePrefix: string,
  runningDate: Date,
  reportId: number,
  fileBaseName: string,
) {
  const fileChunkBody = replaceSeparators(inputFileChunkBody);
  //log.info('fileChunkBody: ' + fileChunkBody.length);
  switch (fileNamePrefix) {
    case 'AMS':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'ams_mittaus',
        amsSchema,
        fileNamePrefix,
      );
      break;
    case 'OHL':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'ohl_mittaus',
        ohlSchema,
        fileNamePrefix,
      );
      break;
    case 'PI':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'pi_mittaus',
        piSchema,
        fileNamePrefix,
      );
      break;
    case 'RC':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'rc_mittaus',
        rcSchema,
        fileNamePrefix,
      );
      break;
    case 'RP':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'rp_mittaus',
        rpSchema,
        fileNamePrefix,
      );
      break;
    case 'TG':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'tg_mittaus',
        tgSchema,
        fileNamePrefix,
      );
      break;
    case 'TSIGHT':
      await parseCsvAndWriteToDb(
        fileChunkBody,
        runningDate,
        reportId,
        fileBaseName,
        'tsight_mittaus',
        tsightSchema,
        fileNamePrefix,
      );
      break;

    default:
      log.warn('Unknown csv file prefix: ' + fileNamePrefix);
      throw new Error('Unknown csv file prefix:');
  }
}

export async function parseCSVFileStream(
  keyData: KeyData,
  fileStream: Readable,
  metadata: ParseValueResult | null,
) {
  log.info('parseCSVFileStream: ' + keyData.fileBaseName);
  const fileBaseName = keyData.fileBaseName;
  const fileNameParts = fileBaseName.split('_');
  const fileNamePrefix = fileNameParts[3];
  log.info('fileNamePrefix: ' + fileNamePrefix);
  const jarjestelmä = fileNamePrefix.toUpperCase();
  const reportId: number = Number(fileNameParts[1]);
  log.info('reportId: ' + reportId);
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

    let myReadPromise = new Promise<void>((resolve, reject) => {
      rl.on('line', async line => {
        lineBuffer.push(line);
        lineCounter++;
        log.info('HELLOOO?: ' + line);
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
      log.info('await myReadPromise');
      await myReadPromise;
      log.info('awaited myReadPromise');
    } catch (err) {
      log.warn('an error has occurred ' + err);
    }

    log.info('Reading file line by line with readline done.' + lineCounter);

    // Last content of lineBuffer not handled yet
    log.info('buffer lines to write: ' + lineBuffer.length + state);
    if (state == ReadState.READING_BODY && lineBuffer.length) {
      await handleBufferedLines(
        csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
        fileNamePrefix,
        runningDate,
        reportId,
        fileBaseName,
      );
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    log.info(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    log.info('HEllo suscses');
    await updateRaporttiStatus(reportId, 'SUCCESS', null);
    log.info('HEllo suscses done');
    return 'success';
  } catch (e) {
    log.warn('csv parsing error ' + e.toString());
    await updateRaporttiStatus(reportId, 'ERROR', e.toString());
    return 'error';
  }
}
