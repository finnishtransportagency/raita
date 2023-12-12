import { IFileResult, ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import { parseAMSCSVData } from './amsCsvDataParser';
import { RaporttiDBSchema } from './raporttiDBSchema';
import { getDBConnection } from './dbUtil';
import { ohlSchema } from './ohlCsvSchema';
import { amsSchema } from './amsCsvSchema';
import { piSchema } from './piCsvSchema';
import {rcSchema} from "./rcCsvSchema";
import {rpSchema} from "./rpCsvSchema";
import {tgSchema} from "./tgCsvSchema";
import {tsightSchema} from "./tsightCsvSchema";

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

export async function parseCSVData(
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

  switch (fileNamePrefix) {
    case 'AMS':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'ams_mittaus',
          amsSchema,
        ));
      break;
    case 'OHL':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'ohl_mittaus',
          ohlSchema,
        ));
      break;
    case 'PI':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'pi_mittaus',
          piSchema,
        ));
      break;
    case 'RC':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'rc_mittaus',
          rcSchema,
        ));
      break;
    case 'RP':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'rp_mittaus',
          rpSchema,
        ));
      break;
    case 'TG':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'tg_mittaus',
          tgSchema,
        ));
      break;
    case 'TSIGHT':
      file.fileBody &&
        (await parseAMSCSVData(
          file.fileBody,
          reportId,
          'tsight_mittaus',
          tsightSchema,
        ));
      break;

    default:
      log.warn('Unknown csv file prefix: ' + fileNamePrefix);
      return 'fail';
  }
  return 'success';
}
