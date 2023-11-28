import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema } from './amsCsvSchema';
import { tidyUpFileBody } from './utils';

function tidyHeadersAMSSpecific(headerLine: string):string{
  var c = headerLine.replace('running_dynamics.', '');
  console.log('c: ' + c);
  return c;
}

export async function parseAMSCSVData(csvFileBody: string) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody, tidyHeadersAMSSpecific);
  console.log(tidyedFileBody);



  var a = parseCSVContent(tidyedFileBody, amsSchema);
  console.log('parsed data: ' + a);
  console.log(a);
}
