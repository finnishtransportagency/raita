import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema, IAms } from './amsCsvSchema';
import { convertToDBRow, readRunningDate, tidyUpFileBody } from './utils';
import { writeRowsToDB } from './dbUtil';
import { AmsDBSchema } from './amsDBSchema';
import postgres from 'postgres';
import {ZodObject} from "zod";

function tidyHeadersAMSSpecific(headerLine: string): string {
  return headerLine
    .replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus')
    .replace(/Running Dynamics\./g, '')
    .replace(/Over Head Line Geometry and Wear\.Ajonopeus/, 'ohl_ajonopeus')
    .replace(/Over Head Line Geometry and Wear\./g, '');
}

export async function parseAMSCSVData(csvFileBody: string, reportId: number, table: string, csvSchema: ZodObject<any>) {
  const runningDate = readRunningDate(csvFileBody);
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);
  const parsedCSVContent = parseCSVContent(tidyedFileBody, csvSchema);

  if (parsedCSVContent.success) {
    console.log('write to db');
    const dbRows: any[] = [];

    parsedCSVContent.validRows.forEach((row: IAms) =>
      dbRows.push(convertToDBRow(row, runningDate, reportId)),
    );
    const result: postgres.Row = await writeRowsToDB(dbRows, table);
    console.log(result.id);

    return { ...parsedCSVContent, ...result };
  }
  return { ...parsedCSVContent };
}
