// tidy up csv header line so headers are correct form for validating
import { log } from '../../../../utils/logger';

function tidyUpDataLines(csvDataLines: string): string {
  //log.info('csvDataLines: ' + csvDataLines.length);
  const tidyedLines = csvDataLines.replace(/NaN/g, '');
  //log.info('tidyedLines: ' + tidyedLines.length);
  return tidyedLines;
}

export function tidyUpHeaderLine(csvHeaderLine: string): string {

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
    //remove square bracketed parts at the end of column name;
    .replace(/\[[^\[\]]*?\]\"/g, '"')
    .replace(/\[[^\[\]]*?\],/g, ',')
    .replace(/\[[^\[\]]*?\]$/, '')
    //remove other square brackets
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    //remove trailing underscores
    .replace(/_\"/g, '"')
    .replace(/_,/g, ',')
    .replace(/_$/, '')
        //replace minus signs with underscore
    .replace(/-/g, '_')
    //replace scandic
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    //remove degree signs
    .replace(/°/g, '');

  return tidyedHeaderLine;
}
export function readRunningDateFromLine(inputFirstLine: string) {
  const firstLine = inputFirstLine.replace(/;/g, ',');
  const found = firstLine.search('Running Date');
  if (found == -1) {
    log.warn('Running date not in file first line');
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



export function isSemicolonSeparatorLine(line: string) {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return semicolonCount > commaCount;
}


export function isSemicolonSeparator(fileBody: string) {
  //we have to find out what is the csv separator; we look at second line (first data line) and count if many semicolons
  const firstNewLinePos = fileBody.search(/\r\n|\r|\n/);
  let temp = fileBody.replace(/\r\n|\r|\n/, '');
  const secondNewLinePos = temp.search(/\r\n|\r|\n/);
  const secondLine = temp.slice(firstNewLinePos, secondNewLinePos);

  return isSemicolonSeparatorLine(secondLine);
}

export function replaceSeparators(fileBody: string) {
  const isSemicolonSeparated = isSemicolonSeparator(fileBody);
  if (isSemicolonSeparated) {
    //replace decimal commas with points; both styles in incoming csv files
    let resultFileBody: string = fileBody.replace(/,/g, '.');

    //replace semicolons with commas; both styles in incoming csv files
    resultFileBody = resultFileBody.replace(/;/g, ',');
    return resultFileBody;
  }

  return fileBody;
}

export function replaceSeparatorsInHeaderLine(line: string) {
  const isSemicolonSeparated = isSemicolonSeparatorLine(line);
  if (isSemicolonSeparated) {
    //replace decimal commas with points; both styles in incoming csv files
    let resultFileBody: string = line.replace(/,/g, '.');

    //replace semicolons with commas; both styles in incoming csv files
    resultFileBody = resultFileBody.replace(/;/g, ',');
    return resultFileBody;
  }
  return line;
}