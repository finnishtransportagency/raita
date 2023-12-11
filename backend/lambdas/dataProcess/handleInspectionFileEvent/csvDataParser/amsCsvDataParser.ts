import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema, IAms } from './amsCsvSchema';
import { readRunningDate, tidyUpFileBody } from './utils';
import { writeRowsToDB } from './dbUtil';
import { AmsDBSchema } from './amsDBSchema';
import {RaporttiDBSchema} from "./raporttiDBSchema";
import postgres from "postgres";

function tidyHeadersAMSSpecific(headerLine: string): string {
  return headerLine
    .replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus')
    .replace(/Running Dynamics\./g, '');
}

function convertToDBRow(
  row: IAms,
  runningDate: Date,
  reportId: number,
): AmsDBSchema {
  return { ...row, raportti_id: reportId, running_date: runningDate };
}

export async function parseAMSCSVData(csvFileBody: string, reportId: number) {
  const runningDate = readRunningDate(csvFileBody);
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);

  const parsedCSVContent = parseCSVContent(tidyedFileBody, amsSchema);

  if (parsedCSVContent.success) {
    console.log('write to db');
    const dbRows: AmsDBSchema[] = [];

    parsedCSVContent.validRows.forEach((row: IAms) =>
      dbRows.push(convertToDBRow(row, runningDate, reportId)),
    );
    const result: postgres.Row = await writeRowsToDB(dbRows);
    console.log(result.id);

    return { ...parsedCSVContent, ...result };
  }
  return { ...parsedCSVContent };
}
