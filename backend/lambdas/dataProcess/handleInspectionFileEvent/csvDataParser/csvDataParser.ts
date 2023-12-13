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
import { TypeOf, ZodObject } from 'zod';
import { readRunningDate, tidyUpFileBody } from './csvConversionUtils';
import { parseCSVContent } from '../../../../utils/zod-csv/csv';
import postgres from 'postgres';

//todo get all needed values from metadata
export async function insertRaporttiData(
  fileBaseName: string,
  fileNamePrefix: string,
  metadata: ParseValueResult,
): Promise<number> {
  const data: RaporttiDBSchema = {
    zip_tiedostonimi: fileBaseName,
    zip_vastaanotto_pvm: new Date(),
    zip_vastaanotto_vuosi: new Date(),
    pvm: new Date(),
    vuosi: new Date(),
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
) {
  const parsedCSVContent = await parseCsvData(fileBody, csvSchema);
  if (parsedCSVContent.success) {
    const dbRows: any[] = [];
    parsedCSVContent.validRows.forEach((row: any) =>
      dbRows.push(convertToDBRow(row, runningDate, reportId)),
    );
    return await writeCsvContentToDb(dbRows, table);
  } else {
    throw Error(
      'Error parsing CSV-file ' + fileBaseName + ' ' + parsedCSVContent.errors,
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
  const reportId: number = await insertRaporttiData(
    fileBaseName,
    fileNamePrefix,
    metadata,
  );

  if (file.fileBody) {
    const fileBody: string = file.fileBody;
    const runningDate = readRunningDate(file.fileBody);

    switch (fileNamePrefix) {
      case 'AMS':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'ams_mittaus',
          amsSchema,
        );
        break;
      case 'OHL':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'ohl_mittaus',
          ohlSchema,
        );
        break;
      case 'PI':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'pi_mittaus',
          piSchema,
        );
        break;
      case 'RC':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'rc_mittaus',
          rcSchema,
        );
        break;
      case 'RP':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'rp_mittaus',
          rpSchema,
        );
        break;
      case 'TG':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'tg_mittaus',
          tgSchema,
        );
        break;
      case 'TSIGHT':
        return await parseCsvAndWriteToDb(
          fileBody,
          runningDate,
          reportId,
          fileBaseName,
          'tsight_mittaus',
          tsightSchema,
        );
        break;

      default:
        log.warn('Unknown csv file prefix: ' + fileNamePrefix);
        throw new Error('Unknown csv file prefix:');
    }
    return 'success';
  } else {
    throw new Error('CVS file has no content');
  }
}
