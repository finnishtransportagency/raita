// tidy up csv header line so headers are correct form for validating
import { log } from '../../../utils/logger';
import { Readable } from 'stream';
import * as readline from 'readline';

function tidyUpDataLines(csvDataLines: string): string {
  //log.info('csvDataLines: ' + csvDataLines.length);
  const tidyedLines = csvDataLines
    //remove semicolon sometimes at the end of file
    .replace(/;/g, '');
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
    .replace(/°/g, '')
    //removeDoubleQuotes
    .replace(/\"/g, '')
    //replace zero-width chars
    .replace(
      /([\u200B]+|[\u200C]+|[\u200D]+|[\u200E]+|[\u200F]+|[\uFEFF]+)/g,
      '',
    );

  return replaceKnownMisspellings(tidyedHeaderLine);
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
  return runningDate;
}

export function tidyUpFileBody(csvFileBody: string) {
  // const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
  const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
  const firstLine = csvFileBody.slice(0, firstNewLinePos);

  let fileBody = csvFileBody;
  if (firstLine.search('Running Date') != -1) {
    //trash first line; csv headears are on the second
    fileBody = csvFileBody.slice(firstNewLinePos + 2);
  }

  const secondNewLinePos = fileBody.search(/\r\n|\r|\n/);
  const csvHeaderLine = fileBody.slice(0, secondNewLinePos);
  //log.info('secondNewLinePos: ' + secondNewLinePos);
  const csvDataLines = fileBody.slice(secondNewLinePos);
  let tidyHeaderLine = tidyUpHeaderLine(csvHeaderLine);
  //log.info('tidyHeaderLine: ' + tidyHeaderLine.length);
  let tidyDataLines = tidyUpDataLines(csvDataLines);
  return tidyHeaderLine.concat(tidyDataLines);
}

export function isSemicolonSeparatorLine(line: string) {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return semicolonCount > commaCount;
}

export function isSemicolonSeparator(fileBody: string) {
  //we have to find out what is the csv separator; we look at second line (first data line) and count if many semicolons
  const firstNewLinePos = fileBody.search(/\n/);
  let temp = fileBody.replace(/\n/, '');
  const secondNewLinePos = temp.search(/\n/);
  const secondLine = temp.slice(firstNewLinePos, secondNewLinePos);

  return isSemicolonSeparatorLine(secondLine);
}

export function replaceSeparators(fileBody: string) {
  const isSemicolonSeparated = isSemicolonSeparator(fileBody);
  let resultFileBody = fileBody.replace(/\r\n|\r|\n/g, '\n');

  if (isSemicolonSeparated) {
    //replace decimal commas with points; both styles in incoming csv files
    resultFileBody = resultFileBody.replace(/,/g, '.');

    //replace semicolons with commas; both styles in incoming csv files
    resultFileBody = resultFileBody.replace(/;/g, ',');
    return resultFileBody;
  }

  return resultFileBody;
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

export function readRunningDate(csvFileBody: string) {
  const lines = csvFileBody.split('\n');
  const firstLine = lines[0];

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
  return runningDate;
}

function replaceKnownMisspellings(tidyedHeaderLine: string): string {
  let result = tidyedHeaderLine
    .replace(/oikean_/g, 'oikea_')
    .replace(/45kuluma/g, '45_kuluma')
    .replace(
      /vasen_ulkopuolisen_purseen_kiintea_keskihajonta/g,
      'vasen_ulkopulisen_purseen_kiintea_keskihajonta',
    )
    .replace(/left_rms_rail_corr_/g, 'vasen_raiteen_aallonrms')
    .replace(/right_rms_rail_corr_/g, 'oikea_raiteen_aallonrms')
    .replace(/10_30mm_fixed_mean/g, '10_30mm_kiintea_keskiarvo')
    .replace(/10_30mm_fixed_stddev/g, '10_30mm_kiintea_keskihaj')

    .replace(/30_100mm_fixed_mean/g, '30_100mm_kiintea_keskiarv')
    .replace(/30_100mm_fixed_stddev/g, '30_100mm_kiintea_keskihaj')

    .replace(/100_300mm_fixed_mean/g, '100_300mm_kiintea_keskiar')
    .replace(/100_300mm_fixed_stddev/g, '100_300mm_kiintea_keskiha')

    .replace(/300_1000mm_fixed_mean/g, '300_1000mm_kiintea_keskia')
    .replace(/300_1000mm_fixed_stddev/g, '300_1000mm_kiintea_keskih')


    .replace(/45kuluma/g, '45_kuluma')
    .replace(/tg_slave_/g, '');


  return result;
}

