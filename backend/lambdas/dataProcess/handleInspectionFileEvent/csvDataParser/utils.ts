// tidy up csv header line so headers are correct form for validating
function tidyUpHeaderLine(csvHeaderLine: string): string {
  //replace spaces with underscore
  var a = csvHeaderLine.replace(/ /g, '_').toLowerCase();
  console.log('a: ' + a);
  //remove square braqeted parts
  var b = a.replace(/\[.*?\]/g, '');
  console.log('b: ' + b);
  //remove trailing underscores
  var c = b.replace(/_\"/g, '"');
  console.log('c: ' + c);
  return c;
}

export function tidyUpFileBody(csvFileBody: string) {
  const firstNewLinePos = csvFileBody.search(/\r\n|\r|\n/);
  console.log('firstNewLinePos: ' + firstNewLinePos);

  //trash first line; csv headears are on the second
  const bodyWithoutFirstLIne = csvFileBody.slice(firstNewLinePos + 1);
  console.log('bodyWithoutFirstLIne: ' + bodyWithoutFirstLIne);
  const secondNewLinePos = bodyWithoutFirstLIne.search(/\r\n|\r|\n/);
  console.log('secondNewLinePos: ' + secondNewLinePos);
  const csvHeaderLine = bodyWithoutFirstLIne.slice(0, secondNewLinePos);
  console.log('csvHeaderLine: ' + csvHeaderLine);

  const csvDataLines = bodyWithoutFirstLIne.slice(secondNewLinePos);
  console.log('csvDataLines: ' + csvDataLines);

  var b = tidyUpHeaderLine(csvHeaderLine);
  console.log('tidyHeaderLine: ' + b);

  return tidyUpHeaderLine(csvHeaderLine).concat(csvDataLines);
}
