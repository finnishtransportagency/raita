import { IFileResult, ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import { RaporttiDBSchema } from './raporttiDBSchema';
import { convertToDBRow, getDBConnection, writeRowsToDB } from './dbUtil';
import { ohlSchema } from './ohlCsvSchema';
import { amsSchema } from './amsCsvSchema';
import { piSchema } from './piCsvSchema';
import { rcSchema } from './rcCsvSchema';
import { rpSchema } from './rpCsvSchema';
import { tgSchema } from './tgCsvSchema';
import { tsightSchema } from './tsightCsvSchema';
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

async function updateRaporttiStatus(
  id: number,
  status: string,
  error: null | string,
) {
  let { schema, sql } = await getDBConnection();
  let errorSubstring = error;
  if(error){
    errorSubstring = error.substring(0,1000);
  }
  try {
    const a = await sql`UPDATE ${sql(
      schema,
    )}.raportti SET status = ${status}, error = ${errorSubstring} WHERE id = ${id};`;
    console.log(a);
  } catch (e) {
    console.log('err');
    console.log(e);
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
  const data: RaporttiDBSchema = {
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
    console.log(id);
    return id.id;
  } catch (e) {
    console.log('err');
    console.log(e);
    throw e;
  }
}

async function writeCsvContentToDb(dbRows: any[], table: string) {
  console.log('write to db');
  const result: postgres.Row = await writeRowsToDB(dbRows, table);

  return result;
}

async function parseCsvData(csvFileBody: string, csvSchema: ZodObject<any>) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody);
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
      console.log(rowKeys);
      rowKeys.forEach(key => {
        errorsOutString += key + ':';
        errorsOutString += JSON.stringify(rowErrors[key].issues);
      });
    }

    throw Error(
      'Error parsing CSV-file ' + fileBaseName + ' ' + errorsOutString+ errorsOutString+ errorsOutString,
    );
  }
}

export async function parseCSVFile(
  fileBaseName: string,
  file: IFileResult,
  metadata: ParseValueResult,
) {
  const fileNameParts = fileBaseName.split('_');
  const fileNamePrefix = fileNameParts[0];
  const jarjestelmä = fileNamePrefix.toUpperCase();
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

  try {
    if (file.fileBody) {
      const fileBody: string = file.fileBody;
      const runningDate = readRunningDate(file.fileBody);

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
      console.log('HEllo suscses');
      await updateRaporttiStatus(reportId, 'SUCCESS', null);
      console.log('HEllo suscses done');
      return 'success';
    } else {
      throw new Error('CVS file has no content');
    }
  } catch (e) {
    await updateRaporttiStatus(reportId, 'ERROR', e.toString());
    return 'error';
  }
}
