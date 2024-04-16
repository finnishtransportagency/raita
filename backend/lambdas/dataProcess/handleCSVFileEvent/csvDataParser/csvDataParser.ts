import { ParseValueResult } from '../../../../types';
import { log } from '../../../../utils/logger';
import {
  convertToDBRow,
  DBConnection,
  raporttiChunksToProcess,
  substractRaporttiChunk,
  updateRaporttiStatus,
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
import { parseCSVContent } from '../../../../utils/zod-csv/csv';
import { Readable } from 'stream';
import * as readline from 'readline';
import { KeyData } from '../../../utils';

function until(conditionFunction: () => any) {
  const poll = (resolve: () => void) => {
    if (conditionFunction()) resolve();
    else setTimeout(_ => poll(resolve), 400);
  };

  // @ts-ignore
  return new Promise(poll);
}

async function parseCsvData(csvFileBody: string, csvSchema: ZodObject<any>) {
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
  fileNamePrefix: string,
  dbConnection: DBConnection,
) {
  const parsedCSVContent = await parseCsvData(fileBody, csvSchema);
  if (parsedCSVContent.success) {
    const dbRows: any[] = [];

    parsedCSVContent.validRows.forEach((row: any) =>
      dbRows.push(convertToDBRow(row, runningDate, reportId, fileNamePrefix)),
    );

    try {
      //disable here if needed stop database
      return await writeRowsToDB(dbRows, table, dbConnection);
      //return;
    } catch (e) {
      log.error('Error writing to db');
      log.error(e);
      throw e;
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

function createFileSchema(
  fileNamePrefix: string,
  csvHeaderLine: string,
): ZodObject<any> {
  let originalSchema: ZodObject<any>;
  switch (fileNamePrefix) {
    case 'AMS':
      originalSchema = amsSchema;
      break;
    case 'OHL':
      originalSchema = ohlSchema;
      break;
    case 'PI':
      originalSchema = piSchema;
      break;
    case 'RC':
      originalSchema = rcSchema;
      break;
    case 'RP':
      originalSchema = rpSchema;
      break;
    case 'TG':
      originalSchema = tgSchema;
      break;
    case 'TSIGHT':
      originalSchema = tsightSchema;
      break;
    default:
      log.warn('Unknown csv file prefix: ' + fileNamePrefix);
      throw new Error('Unknown csv file prefix:');
  }

  //construct a schema with only the headers on file
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

export async function parseCSVFileStream(
  keyData: KeyData,
  fileStream: Readable,
  metadata: ParseValueResult | null,
  dbConnection: DBConnection,
) {
  log.debug('parseCSVFileStream: ' + keyData.fileBaseName);
  const fileBaseName = keyData.fileBaseName;
  const fileNameParts = fileBaseName.split('_');
  let fileNamePrefix = fileNameParts[3];
  if ((fileNamePrefix === 'VR')) {
    fileNamePrefix = fileNameParts[4];
  }

  const reportId: number = Number(fileNameParts[1]);

  let fileSchema: ZodObject<any> | undefined = undefined;

  try {
    let runningDate = new Date();
    let csvHeaderLine = '';

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineBuffer: string[] = [];
    const maxBufferSize = 500;

    let state = ReadState.READING_HEADER as ReadState;

    let lineCounter = 0;
    let handleCounter = 0;

    let notWritten = 0; //number of chunks not written to db yet

    const lineReadPromise = new Promise<void>((resolve, reject) => {
      rl.on('line', async line => {
        lineBuffer.push(line);
        lineCounter++;

        //running date on the firstline unless it's missing; then csv column headers on the first line
        if (state == ReadState.READING_HEADER && lineBuffer.length === 1) {
          if (lineBuffer[0].search('Running Date') != -1) {
            runningDate = readRunningDateFromLine(lineBuffer[0]);
          } else {
            csvHeaderLine = lineBuffer[0];
            state = ReadState.READING_BODY;
            lineBuffer = [];
            fileSchema = createFileSchema(fileNamePrefix, csvHeaderLine);
            log.debug('csvHeaderLine set: ' + csvHeaderLine);
          }
        }

        //csv column headers on the second line when running date was found on the first
        if (state == ReadState.READING_HEADER && lineBuffer.length === 2) {
          csvHeaderLine = lineBuffer[1];
          state = ReadState.READING_BODY;
          lineBuffer = [];
          fileSchema = createFileSchema(fileNamePrefix, csvHeaderLine);
          log.debug('csvHeaderLine set: ' + csvHeaderLine);
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

            try {
              fileSchema &&
                (await handleBufferedLines(
                  csvHeaderLine.concat('\r\n').concat(bufferCopy.join('\r\n')),
                  fileNamePrefix,
                  runningDate,
                  reportId,
                  fileBaseName,
                  dbConnection,
                  fileSchema,
                ));

              notWritten--;
            } catch (e) {
              log.error(
                'ERROR handling buffered csv lines: ' +
                  e +
                  ' ' +
                  bufferCopy.length && bufferCopy[0],
              );
              rl.removeAllListeners();
              rl.close();
              reject(e);
            }
          }
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

    await lineReadPromise.catch(e => {
      log.error('csv file parse or save error' + e);
      throw e;
    });

    // Last content of lineBuffer not handled yet
    if (state == ReadState.READING_BODY && lineBuffer.length && fileSchema) {
      await handleBufferedLines(
        csvHeaderLine.concat('\r\n').concat(lineBuffer.join('\r\n')),
        fileNamePrefix,
        runningDate,
        reportId,
        fileBaseName,
        dbConnection,
        fileSchema,
      );
    }

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    log.debug(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    await substractRaporttiChunk(reportId, dbConnection);
    const chunksLeft = await raporttiChunksToProcess(reportId, dbConnection);
    if (chunksLeft == 0) {
      await updateRaporttiStatus(reportId, 'SUCCESS', null, dbConnection);
    }

    return 'success';
  } catch (e) {
    log.error('csv parsing error, updating status ' + e.toString());
    await updateRaporttiStatus(reportId, 'ERROR', e.toString(), dbConnection);
    return 'error';
  }
}
