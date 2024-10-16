import * as CSV from 'csv-string';

export type CsvRow = { [key: string]: any };
const separator = ',';

export const objectToCsvHeader = (row: CsvRow) => {
  const csvHeader = Object.keys(row);
  return CSV.stringify(csvHeader, separator);
};

export const objectToCsvBody = (rows: CsvRow[]) => {
  const bodyRows = rows.map(row => Object.values(row));
  return CSV.stringify(bodyRows, separator);
};
