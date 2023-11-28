import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema } from './amsCsvSchema';
import { tidyUpFileBody } from './utils';


function tidyHeadersAMSSpecific(headerLine: string):string{
  return headerLine.replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus').replace(/Running Dynamics\./g, '');
}

export async function parseAMSCSVData(csvFileBody: string) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);

  const parsedCSVContent = parseCSVContent(tidyedFileBody, amsSchema);

  console.log('parsed data: ');
  console.log(parsedCSVContent);
  return parsedCSVContent;
}
