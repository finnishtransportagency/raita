// tidy up csv header line so headers are correct form for validating
function tidyUpHeaderLine(csvHeaderLine: string): string {
  var tidyedHeaderLine = csvHeaderLine
    //replace spaces with underscore
    .replace(/ /g, '_')
    .toLowerCase()
    //remove square bracketed parts
    .replace(/\[.*?\]/g, '')
    //remove trailing underscores
    .replace(/_\"/g, '"')
    //replace minus signs with underscore
    .replace(/-/g, '_');

  return tidyedHeaderLine;
}

export function tidyUpFileBody(
  csvFileBody: string,
  reportSpecificTidyHeaderFunction:
    | ((headedLine: string) => string)
    | undefined,
) {
  const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);

  //trash first line; csv headears are on the second
  const bodyWithoutFirstLIne = csvFileBody.slice(firstNewLinePos + 1);
  const secondNewLinePos = bodyWithoutFirstLIne.search(/\r\n|\r|\n/);
  const csvHeaderLine = bodyWithoutFirstLIne.slice(0, secondNewLinePos);

  var headerLineTidiedReportSpecific = csvHeaderLine;
  if (reportSpecificTidyHeaderFunction) {
    headerLineTidiedReportSpecific = reportSpecificTidyHeaderFunction(csvHeaderLine);
  }
  const csvDataLines = bodyWithoutFirstLIne.slice(secondNewLinePos);

  return tidyUpHeaderLine(headerLineTidiedReportSpecific).concat(csvDataLines);
}
