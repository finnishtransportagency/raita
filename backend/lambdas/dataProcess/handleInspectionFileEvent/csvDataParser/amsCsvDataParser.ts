import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema, IAms } from './amsCsvSchema';
import { tidyUpFileBody } from './utils';
import postgres from 'postgres';
import { getConnectionLocalDev, writeRowsToDB } from './dbUtil';

function tidyHeadersAMSSpecific(headerLine: string): string {
  return headerLine
    .replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus')
    .replace(/Running Dynamics\./g, '');
}

async function writeRowsToDB2(header: string[], parsedCSVRows: IAms[]) {
  const schema = 'public';
  const timestamp = new Date(Date.now()).toISOString();
  const sql = await getConnectionLocalDev();

  return await sql`
    INSERT INTO ${sql(schema)}.ams_mittaus
    (sscount, raportti_id, running_date)
    VALUES (19, 3, ${timestamp})`;
}

export async function parseAMSCSVData(csvFileBody: string) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);

  const parsedCSVContent = parseCSVContent(tidyedFileBody, amsSchema);

  if (parsedCSVContent.success) {
    console.log('write to db');
    await writeRowsToDB(parsedCSVContent.header, parsedCSVContent.validRows);
  }
  return parsedCSVContent;
}
