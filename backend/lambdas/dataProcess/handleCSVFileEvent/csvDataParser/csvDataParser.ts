import { ParseValueResult } from '../../../../types';
import {
  log,
  logCSVDBException,
  logCSVParsingException,
} from '../../../../utils/logger';
import {
  convertToDBRow,
  DBConnection,
  raporttiChunksToProcess,
  substractRaporttiChunk,
  updateRaporttiStatus,
  writeMissingColumnsToDb,
  writeRowsToDB,
} from '../../csvCommon/db/dbUtil';
import { ohlSchema } from './csvSchemas/ohlCsvSchema';
import { amsSchema } from './csvSchemas/amsCsvSchema';
import { piSchema } from './csvSchemas/piCsvSchema';
import { rcSchema } from './csvSchemas/rcCsvSchema';
import { rpSchema } from './csvSchemas/rpCsvSchema';
import { tgSchema } from './csvSchemas/tgCsvSchema';
import { tsightSchema } from './csvSchemas/tsightCsvSchema';
import { z, ZodObject, ZodRawShape } from 'zod';
import {
  readRunningDateFromLine,
  replaceSeparators,
  replaceSeparatorsInHeaderLine,
  tidyUpFileBody,
  tidyUpHeaderLine,
} from '../../csvCommon/csvConversionUtils';
import { parseCSVContent } from 'zod-csv';
import { Readable } from 'stream';
import * as readline from 'readline';
import { KeyData } from '../../../utils';
import { IAdminLogger } from '../../../../utils/adminLog/types';
import { PostgresLogger } from '../../../../utils/adminLog/postgresLogger';

const adminLogger: IAdminLogger = new PostgresLogger();

function until(conditionFunction: () => any) {
  const poll = (resolve: () => void) => {
    if (conditionFunction()) resolve();
    else setTimeout((_: any) => poll(resolve), 400);
  };

  // @ts-ignore
  return new Promise(poll);
}

export async function parseCsvData(
  csvFileBody: string,
  csvSchema: ZodObject<any>,
) {
  const tidyedFileBody = tidyUpFileBody(csvFileBody);
  const parsedCSVContent = parseCSVContent(tidyedFileBody, csvSchema);
  return { ...parsedCSVContent };
}

async function parseCsvAndWriteToDb(
  fileBody: string,
  runningDate: Date,
  reportId: number,
  fileBaseName: string,
  table: string,
  csvSchema: ZodObject<any>,
  missingOptionalColumns: string[] | undefined,
  fileNamePrefix: string,
  dbConnection: DBConnection,
) {
  const parsedCSVContent = await parseCsvData(fileBody, csvSchema);
  if (parsedCSVContent.success) {
    const dbRows: any[] = [];

    parsedCSVContent.validRows.forEach((row: any) =>
      dbRows.push(
        convertToDBRow(
          row,
          runningDate,
          reportId,
          fileNamePrefix,
          missingOptionalColumns,
        ),
      ),
    );

    try {
      //disable here if needed stop database
      return await writeRowsToDB(dbRows, table, dbConnection);
      //return;
    } catch (error) {
      logCSVDBException.error(
        { errorType: error.errorType, fileName: fileBaseName },
        `${error.message}. CSV rows write to db failed.`,
      );
      log.error('Error writing to db');
      log.error(error);
      throw error;
    }
  } else {
    const errors = parsedCSVContent.errors;
    let errorsOutString = '';

    const headerErrors = errors.header;
    errorsOutString += JSON.stringify(headerErrors);

    const rowErrors = errors.rows;
    if (rowErrors) {
      const rowKeys = Object.keys(rowErrors);
      rowKeys.forEach(key => {
        errorsOutString += key + ':';
        errorsOutString += JSON.stringify(rowErrors[key].issues);
      });
    }

    log.warn(errorsOutString);
    throw Error(
      'Error parsing CSV-file ' + fileBaseName + ' ' + errorsOutString,
    );
  }
}

enum ReadState {
  READING_HEADER = 'READING_HEADER',
  READING_BODY = 'READING_BODY',
}

async function handleBufferedLines(
  inputFileChunkBody: string,
  fileNamePrefix: string,
  runningDate: Date,
  reportId: number,
  fileBaseName: string,
  dbConnection: DBConnection,
  fileSchema: ZodObject<any>,
  missingOptionalColumns: string[] | undefined,
) {
  try {
    const fileChunkBody = replaceSeparators(inputFileChunkBody);
    //log.info('fileChunkBody: ' + fileChunkBody.length);
    switch (fileNamePrefix) {
      case 'AMS':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'ams_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;
      case 'OHL':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'ohl_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;
      case 'PI':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'pi_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;
      case 'RC':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'rc_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;
      case 'RP':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'rp_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;
      case 'TG':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'tg_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;
      case 'TSIGHT':
        await parseCsvAndWriteToDb(
          fileChunkBody,
          runningDate,
          reportId,
          fileBaseName,
          'tsight_mittaus',
          fileSchema,
          missingOptionalColumns,
          fileNamePrefix,
          dbConnection,
        );
        break;

      default:
        log.warn('Unknown csv file prefix: ' + fileNamePrefix);
        throw new Error('Unknown csv file prefix:');
    }
  } catch (e) {
    log.error('handleBufferedLines: ' + e);
    throw e;
  }
}

export function createFileSchema(fileNamePrefix: string): ZodObject<any> {
  let schema: ZodObject<any>;
  switch (fileNamePrefix) {
    case 'AMS':
      schema = amsSchema;
      break;
    case 'OHL':
      schema = ohlSchema;
      break;
    case 'PI':
      schema = piSchema;
      break;
    case 'RC':
      schema = rcSchema;
      break;
    case 'RP':
      schema = rpSchema;
      break;
    case 'TG':
      schema = tgSchema;
      break;
    case 'TSIGHT':
      schema = tsightSchema;
      break;
    default:
      log.warn('Unknown csv file prefix: ' + fileNamePrefix);
      throw new Error('Unknown csv file prefix:');
  }
  return schema;
}

/**
 * Get schema that only has headers that are in header line
 */
export function removeMissingHeadersFromSchema(
  originalSchema: ZodObject<any>,
  csvHeaderLine: string,
): ZodObject<any> {
  const tidyHeaderLine = replaceSeparatorsInHeaderLine(
    tidyUpHeaderLine(csvHeaderLine),
  );
  const splittedHeader: string[] = tidyHeaderLine.split(',');
  const copyShape: ZodRawShape = {};
  Object.assign(copyShape, originalSchema.shape);
  const copySchema = z.object(copyShape);
  for (let prop in copyShape) {
    if (Object.prototype.hasOwnProperty.call(copyShape, prop)) {
      if (!splittedHeader.includes(prop)) {
        delete copyShape[prop];
      }
    }
  }
  return copySchema;
}

/**
 * Get lists of required and missing headers according to schema
 */
export function validateHeaders(
  schema: ZodObject<any>,
  csvHeaderLine: string,
): { extra: string[]; missingOptional: string[]; missingRequired: string[] } {
  const tidyHeaderLine = replaceSeparatorsInHeaderLine(
    tidyUpHeaderLine(csvHeaderLine),
  );
  const inputHeaders: string[] = tidyHeaderLine.split(',');

  const schemaHeaders: string[] = schema.keyof().options; // get tuple of schema object keys

  const extraHeaders = inputHeaders.filter(
    header => !schemaHeaders.includes(header),
  );

  const optionalHeaders = schemaHeaders.filter((header: string) =>
    schema.shape[header].isOptional(),
  );
  const requiredHeaders = schemaHeaders.filter(
    (header: string) => !schema.shape[header].isOptional(),
  );

  const missingOptionalHeaders = optionalHeaders.filter(
    (schemaHeader: string) => !inputHeaders.includes(schemaHeader),
  );
  const missingRequiredHeaders = requiredHeaders.filter(
    (schemaHeader: string) => !inputHeaders.includes(schemaHeader),
  );

  return {
    extra: extraHeaders,
    missingOptional: missingOptionalHeaders,
    missingRequired: missingRequiredHeaders,
  };
}

export async function parseCSVFileStream(
  keyData: KeyData,
  fileStream: Readable,
  dbConnection: DBConnection,
  invocationId: string = 'DEFAULT_ID_FOR_TESTS',
) {
  log.debug('parseCSVFileStream: ' + keyData.fileBaseName);
  await adminLogger.init('data-csv', invocationId);
  const fileBaseName = keyData.fileBaseName;
  const fileNameParts = fileBaseName.split('_');
  let fileNamePrefix = fileNameParts[3];
  if (fileNamePrefix === 'VR') {
    fileNamePrefix = fileNameParts[4];
  }

  const reportId: number = Number(fileNameParts[1]);

  let fileSchema: ZodObject<any> | undefined = undefined;
  let missingOptionalColumns: string[] | undefined = undefined;

  try {
    let runningDate = new Date();
    let csvHeaderLine = '';

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineBuffer: string[] = [];
    const maxBufferSize = 250;

    let state = ReadState.READING_HEADER as ReadState;

    let lineCounter = 0;
    let handleCounter = 0;

    let notWritten = 0; //number of chunks not written to db yet

    const lineReadPromise = new Promise<void>((resolve, reject) => {
      rl.on('line', async line => {
        try {
          lineBuffer.push(line);
          lineCounter++;

          if (state == ReadState.READING_HEADER) {
            //running date on the firstline unless it's missing; then csv column headers on the first line
            //csv column headers on the second line when running date was found on the first
            rl.pause();
            if (
              lineBuffer.length === 1 &&
              lineBuffer[0].search('Running Date') != -1
            ) {
              runningDate = readRunningDateFromLine(lineBuffer[0]);
            } else {
              csvHeaderLine = lineBuffer[lineBuffer.length - 1]; // line 1 or 2
              state = ReadState.READING_BODY;
              lineBuffer = [];
              const originalSchema = createFileSchema(fileNamePrefix);
              log.debug('csvHeaderLine set: ' + csvHeaderLine);
              const headerValidation = validateHeaders(
                originalSchema,
                csvHeaderLine,
              );
              if (headerValidation.missingRequired.length) {
                log.error({
                  msg: 'Missing required fields',
                  missingRequired: headerValidation.missingRequired,
                });
                throw Error('Missing required fields');
              }
              if (headerValidation.missingOptional.length) {
                log.warn({
                  msg: 'Missing optional fields',
                  missingOptional: headerValidation.missingOptional,
                });
                missingOptionalColumns = headerValidation.missingOptional;
                await adminLogger.info(
                  `Tiedoston ${fileBaseName} csv tiedostosta puuttuu ei-pakollisia kolumneja: ` +
                    missingOptionalColumns,
                );
                try {
                  await writeMissingColumnsToDb(
                    reportId,
                    headerValidation.missingOptional,
                    dbConnection,
                  );
                } catch (error) {
                  log.error('writeMissingColumnsToDb failed');
                  logCSVDBException.error(
                    { errorType: error.errorType },
                    'writeMissingColumnsToDb failed',
                  );
                  throw error;
                }
              }
              if (headerValidation.extra.length) {
                log.warn({
                  msg: 'Extra header fields',
                  extra: headerValidation.extra,
                });
              }
              fileSchema = removeMissingHeadersFromSchema(
                originalSchema,
                csvHeaderLine,
              );
            }
            rl.resume();
          }
          //read body lines as maxBufferSize chunks, put column headers at beginning on each chunk so zod-csv can handle them
          if (state == ReadState.READING_BODY) {
            if (lineBuffer.length > maxBufferSize) {
              rl.pause();
              handleCounter++;

              const bufferCopy = lineBuffer.slice();
              lineBuffer = [];

              rl.resume();
              notWritten++;

              await until(() => fileSchema != undefined);
              try {
                fileSchema &&
                  (await handleBufferedLines(
                    csvHeaderLine
                      .concat('\r\n')
                      .concat(bufferCopy.join('\r\n')),
                    fileNamePrefix,
                    runningDate,
                    reportId,
                    fileBaseName,
                    dbConnection,
                    fileSchema,
                    missingOptionalColumns,
                  ));

                notWritten--;
              } catch (error) {
                logCSVParsingException.error(
                  { errorType: error.errorType, fileName: fileBaseName },
                  `${error.message}. Handling CSV lines failed.`,
                );
                log.error(
                  'ERROR handling buffered csv lines: ' +
                    error +
                    ' ' +
                    bufferCopy.length && bufferCopy[0],
                );
                throw error;
              }
            }
          }
        } catch (error) {
          logCSVParsingException.error(
            { errorType: error.errorType, fileName: fileBaseName },
            `${error.message}. Handling CSV lines failed.`,
          );
          log.error('ERROR handling csv lines: ' + error);
          rl.removeAllListeners();
          rl.close();
          reject(error);
        }
      });
      rl.on('error', () => {
        log.error('rl on error ');
      });
      rl.on('close', async function () {
        await until(() => notWritten == 0);
        log.debug('close');
        resolve();
      });
    });

    await lineReadPromise
      .then(() => {
        log.info('lineReadPromise resolved');
      })
      .catch(error => {
        logCSVParsingException.error(
          { errorType: error.errorType, fileName: fileBaseName },
          `${error.message}. Handling CSV lines failed.`,
        );
        log.error('csv file parse or save error' + error);

        throw error;
      });

    // Last content of lineBuffer not handled yet

    await until(() => fileSchema != undefined);
    if (state == ReadState.READING_BODY && fileSchema) {
      if (lineBuffer.length) {
        await handleBufferedLines(
          csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
          fileNamePrefix,
          runningDate,
          reportId,
          fileBaseName,
          dbConnection,
          fileSchema,
          missingOptionalColumns,
        );
      }
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    log.debug(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    try {
      await substractRaporttiChunk(reportId, dbConnection);
      const chunksLeft = await raporttiChunksToProcess(reportId, dbConnection);
      if (chunksLeft == 0) {
        await updateRaporttiStatus(reportId, 'SUCCESS', null, dbConnection);
      }
    } catch (error) {
      logCSVDBException.error(
        { errorType: error.errorType },
        'Status or chunk processsing db failure',
      );
      await adminLogger.error(
        `Tiedoston ${fileBaseName} csv parsiminen epäonnistui. Status or chunk processsing db failure.` +
          error,
      );

      throw error;
    }

    return 'success';
  } catch (error) {
    logCSVParsingException.warn(
      { errorType: error.errorType, fileName: fileBaseName },
      `${error.message}. CSV parsing failure.`,
    );
    log.error('csv parsing error, updating status ' + error.toString());
    try {
      await updateRaporttiStatus(
        reportId,
        'ERROR',
        error.toString(),
        dbConnection,
      );
      await adminLogger.error(
        `Tiedoston ${fileBaseName} csv parsiminen epäonnistui. Raportti tallennettu ERROR-statuksella.` +
          error,
      );
    } catch (error) {
      logCSVDBException.error(
        { errorType: error.errorType },
        'Parsing error status update db failure',
      );
      await adminLogger.error(
        `Tiedoston ${fileBaseName} csv parsiminen epäonnistui. Raportin päivitys ERROR-statukselle epäonnistui.` +
          error,
      );
      throw error;
    }
    return 'error';
  }
}
