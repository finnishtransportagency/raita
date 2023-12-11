import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema, IAms } from './amsCsvSchema';
import { readRunningDate, tidyUpFileBody } from './utils';
import { writeRowsToDB } from './dbUtil';
import { AmsDBSchema } from './amsDBSchema';

function tidyHeadersAMSSpecific(headerLine: string): string {
  return headerLine
    .replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus')
    .replace(/Running Dynamics\./g, '');
}

function convertToDBRow(row: IAms, runningDate: Date): AmsDBSchema {
  return { ...row, raportti_id: 3, running_date: runningDate };
}

export async function parseAMSCSVData(csvFileBody: string) {
  const runningDate = readRunningDate(csvFileBody);
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);

  const parsedCSVContent = parseCSVContent(tidyedFileBody, amsSchema);

  if (parsedCSVContent.success) {
    console.log('write to db');
    const dbRows: AmsDBSchema[] = [];

    parsedCSVContent.validRows.forEach((row: IAms) =>
      dbRows.push(convertToDBRow(row, runningDate)),
    );
    const result = await writeRowsToDB(dbRows);
    console.log(result);
    console.log(result.pop());

    return {...parsedCSVContent, ...result};
  }
  return {...parsedCSVContent};
}
