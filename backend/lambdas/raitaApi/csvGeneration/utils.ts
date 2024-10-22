import * as CSV from 'csv-string';

type Row = { [key: string]: any };
const separator = ';';

export const objectToCsvHeader = (row: Row) => {
  const csvHeader = Object.keys(row);
  return CSV.stringify(csvHeader, separator);
};

export const objectToCsvBody = (rows: Row[]) => {
  const bodyRows = rows.map(row => Object.values(row));
  return CSV.stringify(bodyRows, separator);
};

export const formatDate = (date: Date): String => {
  // Get the day, month, and year from the Date object
  const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with 0 if needed
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so we add 1
  const year = date.getFullYear(); // Get the full year

  // Return the formatted date in dd.mm.yyyy format
  return `${day}.${month}.${year}`;
};
