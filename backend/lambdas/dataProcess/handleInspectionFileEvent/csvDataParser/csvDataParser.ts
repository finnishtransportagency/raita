import { IFileResult, ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import { parseAMSCSVData } from './amsCsvDataParser';
import { RaporttiDBSchema } from './raporttiDBSchema';
import { getDBConnection } from './dbUtil';

//todo get all needed values from metadata
async function insertRaporttiData(
  fileBaseName: string,
  fileNamePrefix: string,
  metadata: ParseValueResult,
) {
  const data: RaporttiDBSchema = {
    zip_tiedostonimi: fileBaseName,
    zip_vastaanotto_pvm: new Date(),
    zip_vastaanotto_vuosi: new Date(),
    pvm: new Date(),
    vuosi: new Date(),
  };

  let { schema, sql } = await getDBConnection();

  try {
    const reportID = await sql`INSERT INTO ${sql(schema)}.ams_mittaus ${sql(
      data,
    )} returning id`;
    console.log(reportID);
    return reportID;
  } catch (e) {
    console.log('err');
    console.log(e);
    return null;
  }
}

export async function parseCSVData(
  fileBaseName: string,
  file: IFileResult,
  metadata: ParseValueResult,
) {
  const fileNameParts = fileBaseName.split('_');
  const fileNamePrefix = fileNameParts[0];

  switch (fileNamePrefix) {
    case 'AMS':
      const reportId  = await insertRaporttiData(
        fileBaseName,
        fileNamePrefix,
        metadata,
      );
      //consi id = reportId.
      file.fileBody && (await parseAMSCSVData(file.fileBody));
      break;
    default:
      log.warn('Unknown csv file prefix: ' + fileNamePrefix);
      return 'fail';
  }
  return 'success';
}
