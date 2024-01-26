import {IFileResult, IFileStreamResult, ParseValueResult} from '../../../../types';
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
import {
  baseObjectInputType,
  baseObjectOutputType,
  TypeOf,
  undefined,
  z,
  ZodEffects,
  ZodNumber,
  ZodObject,
  ZodString,
  ZodTypeAny,
} from 'zod';
import { readRunningDate, tidyUpFileBody } from './csvConversionUtils';
import { parseCSVContent } from '../../../../utils/zod-csv/csv';
import postgres from 'postgres';
import { stringify } from 'ts-jest';
import {Readable} from "stream";

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
  log.info('tidyedFileBody: ' + tidyedFileBody.substring(0,600));
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

function isSemicolonSeparator(fileBody: string) {
  //we have to find out what is the csv separator; we look at third line (first or second data line) and count if many semicolons

  //no splitting whole body to save memory
  let temp = fileBody.replace(/\r\n|\r|\n/, '');
  const secondNewLinePos = temp.search(/\r\n/);
  temp = temp.replace(/\r\n|\r|\n/, '');
  const thirdNewLinePos = temp.search(/\r\n/);
  const thirdLine = temp.slice(secondNewLinePos, thirdNewLinePos);

  const semicolonCount = (thirdLine.match(/;/g) || []).length;
  const commaCount = (thirdLine.match(/,/g) || []).length;
  return semicolonCount > commaCount;
}

function replaceSeparators(fileBody: string) {
  const isSemicolonSeparated =  isSemicolonSeparator(fileBody);
  if(isSemicolonSeparated){
    //replace decimal commas with points; both styles in incoming csv files
    let resultFileBody: string = fileBody.replace(/,/g, '.');

    //replace semicolons with commas; both styles in incoming csv files
    resultFileBody = resultFileBody.replace(/;/g, ',');
    return resultFileBody;
  }

  return fileBody;
}

export async function parseCSVFile(
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
    fileStream.read(1000);
    fileStream.
    if (fileStream.fileBody) {
      const fileBody = replaceSeparators(fileStream.fileBody);
      log.info('fileBody: ' + fileBody.substring(0, 100));
      const runningDate = readRunningDate(fileBody);
      log.info('runningDate: ' + runningDate);
      switch (fileNamePrefix) {
        case 'AMS':
          await parseCsvAndWriteToDb(
            fileBody,
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
            fileBody,
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
            fileBody,
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
            fileBody,
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
            fileBody,
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
            fileBody,
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
            fileBody,
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
      log.info('HEllo suscses');
      await updateRaporttiStatus(reportId, 'SUCCESS', null);
      log.info('HEllo suscses done');
      return 'success';
    } else {
      log.warn('CVS file has no content');
      throw new Error('CVS file has no content');
    }
  } catch (e) {
    log.warn('csv parsing error ' + e.toString());
    await updateRaporttiStatus(reportId, 'ERROR', e.toString());
    return 'error';
  }
}
