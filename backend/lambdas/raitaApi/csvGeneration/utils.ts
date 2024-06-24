import * as CSV from 'csv-string';

type Row = { [key: string]: any };
const separator = ',';

export const objectToCsvHeader = (row: Row) => {
  const csvHeader = Object.keys(row);
  return CSV.stringify(csvHeader, separator);
};

export const objectToCsvBody = (rows: Row[]) => {
  const bodyRows = rows.map(row => Object.values(row));
  return CSV.stringify(bodyRows, separator);
};
