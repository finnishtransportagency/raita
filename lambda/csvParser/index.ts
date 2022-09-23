// import { parse } from 'csv-parse';
import { S3 } from 'aws-sdk';
// import { parse as parseSync } from 'csv-parse/sync';
import { parse } from 'csv-parse';
import { logger } from '../utils/logger';

/**
 * This is a simple sync parser...
 */
export function parseCSV(body: S3.Body): Promise<Array<Object>> {
  return new Promise((resolve, reject) => {
    // logger.log(fileBody);´

    const records: Array<Object> = [];
    // Initialize the parser
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
    });

    parser.on('readable', function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    // Catch any error
    parser.on('error', function (err) {
      logger.log(err.message);
      reject(err);
    });
    // Test that the parsed records matched the expected records
    parser.on('end', function () {
      logger.log('GOT TO END!!!');
      resolve(records);
    });

    parser.on('close', function () {
      logger.log('GOT TO CLOSE!!!');
      resolve(records);
    });

    parser.write(body);
    parser.end();
    logger.log('THIS IS AFTER END');
  });

  // const records = parseSync(fileBody, {
  //   columns: true,
  //   skip_empty_lines: true,
  // });

  // logger.log(records);
  // return records;
}
