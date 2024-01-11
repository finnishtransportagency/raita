// tidy up csv header line so headers are correct form for validating
import { log } from '../../../../utils/logger';

function tidyUpDataLines(csvDataLines: string): string {
  var tidyedLines= csvDataLines
      .replace(/NaN/g, '')
  log.info("tidyedLines: " + tidyedLines);
  return tidyedLines
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
  const found = firstLine.search('Running Date');
  if (found == -1) {
    log.error('Running date not in file first line');
    return new Date();
  }
  const firstLineSplitted = firstLine.split(',');
  const runningDateString = firstLineSplitted[1];
  const runningDateStringDatePart = runningDateString.split(' ')[0];
  const splitted = runningDateStringDatePart.split('/');
  const day = splitted[0].substring(1);
  const month = splitted[1];
  const year = splitted[2];
  const runningDate = new Date(Number(year), Number(month), Number(day));
  console.log(runningDate);
  return runningDate;
}

export function tidyUpFileBody(csvFileBody: string) {
 // const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
  const firstNewLinePos = csvFileBody.search(/\r\n/);

  //trash first line; csv headears are on the second
  const bodyWithoutFirstLIne = csvFileBody.slice(firstNewLinePos + 2);
  const secondNewLinePos = bodyWithoutFirstLIne.search(/\r\n|\r|\n/);
  const csvHeaderLine = bodyWithoutFirstLIne.slice(0, secondNewLinePos);
  log.info('csvHeaderLine: ' + csvHeaderLine);
  const csvDataLines = bodyWithoutFirstLIne.slice(secondNewLinePos);

  return tidyUpHeaderLine(csvHeaderLine).concat(tidyUpDataLines(csvDataLines));
}
