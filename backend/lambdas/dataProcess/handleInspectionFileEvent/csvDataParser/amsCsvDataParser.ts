import { parseCSVContent } from '../../../../utils/zod-csv/zcsv';
import { amsSchema } from './amsCsvSchema';
import { tidyUpFileBody } from './utils';

export async function parseAMSCSVData(csvFileBody: string) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody);
  console.log(tidyedFileBody);

  var a = parseCSVContent(tidyedFileBody, amsSchema);
  console.log('parsed data: ' + a);
  console.log(a);
}
