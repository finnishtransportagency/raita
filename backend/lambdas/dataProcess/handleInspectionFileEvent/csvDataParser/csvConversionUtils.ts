// tidy up csv header line so headers are correct form for validating
import { log } from '../../../../utils/logger';
import { ZodObject } from 'zod';

function tidyUpDataLines(csvDataLines: string): string {
  var tidyedLines = csvDataLines.replace(/NaN/g, '');
  log.info('tidyedLines: ' + tidyedLines);
  return tidyedLines;
}

function tidyUpHeaderLine(csvHeaderLine: string): string {
  var tidyedHeaderLine = csvHeaderLine
    //prefix second ajonopeus fields
    .replace(/Running Dynamics\.Ajonopeus/, 'ams_ajonopeus')
    .replace(/Over Head Line Geometry and Wear\.Ajonopeus/, 'ohl_ajonopeus')
    .replace(/Rail Profile\.Ajonopeus/, 'rp_ajonopeus')
    //remove prefixes from headers
    .replace(/Running Dynamics\./g, '')
    .replace(/Pantograph\/Catenary Interaction\./g, '')
    .replace(/Over Head Line Geometry and Wear\./g, '')
    .replace(/Rail Corrugation\./g, '')
    .replace(/Rail Profile\./g, '')
    .replace(/TG Master\./g, '')
    .replace(/T-Sight 600\./g, '')
    .replace(/Over Head Line Geometry and Wear\./g, '')
    //replace spaces with underscore
    .replace(/ /g, '_')
    //replace points with underscore
    .replace(/\./g, '_')
    .toLowerCase()
    //remove square bracketed parts at the end of column name
    .replace(/\[[^\[\]]*?\]\"/g, '"')
    //remove other square brackets
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    //remove trailing underscores
    .replace(/_\"/g, '"')
    //replace minus signs with underscore
    .replace(/-/g, '_')
    //replace scandic
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    //remove degree signs
    .replace(/°/g, '');

  return tidyedHeaderLine;
}

export function readRunningDate(csvFileBody: string) {
  const lines = csvFileBody.split('\n');
  const firstLine = lines[0];
  log.info('firstLine: ' + firstLine);
  const found = firstLine.search('Running Date');
  if (found == -1) {
    log.warn('Running date not in file first line');
    return new Date();
  }
  const firstLineSplitted = firstLine.split(',');
  log.info('1');
  const runningDateString = firstLineSplitted[1];
  log.info('2');
  const runningDateStringDatePart = runningDateString.split(' ')[0];
  log.info('3');
  const splitted = runningDateStringDatePart.split('/');
  log.info('4');
  const day = splitted[0].substring(1);
  log.info('5');
  const month = splitted[1];
  log.info('6');
  const year = splitted[2];
  log.info('7');
  const runningDate = new Date(Number(year), Number(month), Number(day));
  console.log(runningDate);
  return runningDate;
}

export function tidyUpFileBody(csvFileBody: string) {
  // const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
  const firstNewLinePos = csvFileBody.search(/\r\n/);
  const firstLine = csvFileBody.slice(0, firstNewLinePos);
  let fileBody = csvFileBody;
  if (firstLine.search('Running Date') != -1) {
    //trash first line; csv headears are on the second
    fileBody = csvFileBody.slice(firstNewLinePos + 2);
  }

  const secondNewLinePos = fileBody.search(/\r\n|\r|\n/);
  const csvHeaderLine = fileBody.slice(0, secondNewLinePos);
  log.info('csvHeaderLine: ' + csvHeaderLine);
  const csvDataLines = fileBody.slice(secondNewLinePos);
  let tidyHeaderLine = tidyUpHeaderLine(csvHeaderLine);
  let tidyDataLines = tidyUpDataLines(csvDataLines);
  //TODO make more generic to any missing column?
  log.info('tidyHeaderLine.substring(0,6)' + tidyHeaderLine.substring(0, 10));
  if (tidyHeaderLine.substring(0, 10) != '\"sscount\"') {
    tidyHeaderLine = '\"sscount\",' + tidyHeaderLine;
    log.info('tidyHeaderLine new' + tidyHeaderLine.substring(0, 15));
    tidyDataLines = tidyDataLines.replace(/\n/g, '\n,');
    log.info(
      'tidyDataLines.substring(0,1000)' + tidyDataLines,
    );
  }

  return tidyHeaderLine.concat(tidyDataLines);
}
