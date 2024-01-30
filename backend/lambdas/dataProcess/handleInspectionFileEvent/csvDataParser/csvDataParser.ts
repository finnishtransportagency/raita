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
  replaceSeparatorsInHeaderLine,
  tidyUpFileBody,
  tidyUpHeaderLine,
} from './csvConversionUtils';
import { parseCSVContent } from '../../../../utils/zod-csv/csv';
import postgres from 'postgres';
import { Readable } from 'stream';
import * as readline from 'readline';
import * as events from 'events';

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
  metadata: ParseValueResult,
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
  log.info('write to db');
  const result: postgres.Row = await writeRowsToDB(dbRows, table);

  return result;
}

async function parseCsvData(csvFileBody: string, csvSchema: ZodObject<any>) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody);
  log.info('tidyedFileBody: ' + tidyedFileBody.substring(0, 600));
  const parsedCSVContent = parseCSVContent(tidyedFileBody, csvSchema);
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
    return await writeCsvContentToDb(dbRows, table);
  } else {
    const errors = parsedCSVContent.errors;
    let errorsOutString = '';

    const headerErrors = errors.header;
    errorsOutString += JSON.stringify(headerErrors);

    const rowErrors = errors.rows;
    if (rowErrors) {
      const rowKeys = Object.keys(rowErrors);
      log.info(rowKeys);
      rowKeys.forEach(key => {
        errorsOutString += key + ':';
        errorsOutString += JSON.stringify(rowErrors[key].issues);
      });
    }

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
  log.info('fileChunkBody: ' + fileChunkBody);
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
  fileBaseName: string,
  fileStream: Readable,
  metadata: ParseValueResult,
) {
  log.info('fileBaseName: ' + fileBaseName);
  const fileNameParts = fileBaseName.split('_');
  log.info('fileNameParts: ' + fileNameParts);
  const fileNamePrefix = fileNameParts[0];
  log.info('fileNamePrefix: ' + fileNamePrefix);
  const jarjestelmä = fileNamePrefix.toUpperCase();
  log.info('jarjestelmä: ' + jarjestelmä);
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
  try {
    let runningDate = new Date();
    let csvHeaderLine = '';

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineBuffer: string[] = [];
    const maxBufferSize = 1000;

    let state = ReadState.READING_HEADER as ReadState;

    rl.on('line', async line => {
      lineBuffer.push(line);

      //running date on the firstine unless it's missing; then csv column headers on the first line
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

      //read body lines as maxBufferSize chunks, put column headers at beginning on each chunk so zod-csv can hadle them
      if (state == ReadState.READING_BODY) {
        if (lineBuffer.length > maxBufferSize) {
          log.info("buffer full handling");
          await handleBufferedLines(
            csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
            fileNamePrefix,
            runningDate,
            reportId,
            fileBaseName,
          );
          lineBuffer = [];
        }
      }
    });


    log.info('Reading file line by line with readline starting.');
    await events.EventEmitter.once(rl, 'close');
    log.info('Reading file line by line with readline done.');

    // Last content of lineBuffer not handled yet
    log.info('state now: ' + state);
    log.info(
      'file now: ' +
        csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
    );
    if (state == ReadState.READING_BODY && lineBuffer.length) {
      handleBufferedLines(
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
