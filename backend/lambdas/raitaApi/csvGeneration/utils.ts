import * as CSV from 'csv-string';
import { CsvRow, MittausDbResult } from './types';
import { Decimal } from '@prisma/client/runtime/library';
import { compareAsc, format } from 'date-fns';

const separator = ',';

export const objectToCsvHeader = (row: CsvRow) => {
  const csvHeader = row.map(column => column.header);
  return CSV.stringify(csvHeader, separator);
};

export const objectToCsvBody = (rows: CsvRow[]) => {
  const bodyRows = rows.map(row => row.map(column => column.value));
  return CSV.stringify(bodyRows, separator);
};

export const mapMittausRowsToCsvRows = (
  mittausRows: MittausDbResult[],
  raporttiRows: { id: number; inspection_date: Date | null }[],
  selectedColumns: string[],
): CsvRow[] => {
  // TODO ensure last row is full?

  const raporttiSorted = [...raporttiRows].sort((a, b) =>
    compareAsc(a.inspection_date ?? 0, b.inspection_date ?? 0),
  );

  const mappedByRataosoite: { [rataosoite: string]: MittausDbResult[] } = {};
  mittausRows.forEach(row => {
    const key = `${row.rata_kilometri}-${row.rata_metrit}`;
    if (mappedByRataosoite[key]) {
      mappedByRataosoite[key].push(row);
    } else {
      mappedByRataosoite[key] = [row];
    }
  });
  const rows: CsvRow[] = [];
  Object.keys(mappedByRataosoite).forEach(rataosoite => {
    const currentRows = mappedByRataosoite[rataosoite];
    const csvRow: CsvRow = [
      {
        header: 'rata_kilometri',
        value: `${currentRows[0].rata_kilometri ?? ''}`,
      },
      {
        header: 'rata_metrit',
        value: `${currentRows[0].rata_metrit ?? ''}`,
      },
      {
        header: 'track',
        value: `${currentRows[0].track ?? ''}`,
      },
    ];

    raporttiSorted.forEach(raportti => {
      const mittaus = currentRows.find(r => r.raportti_id === raportti.id);
      // if mittaus is undefined, still add values but as empty strings
      const vals: CsvRow = []; // TODO map
      selectedColumns.forEach(columnName => {
        const mittausAsObj: { [key: string]: any } = { ...mittaus };
        const date = raportti.inspection_date
          ? format(raportti.inspection_date, 'dd.MM.yyyy')
          : 'missing_date';
        vals.push({
          header: `${columnName} ${date}`,
          value: convertPrismaValueToCsvValue(
            columnName,
            mittausAsObj[columnName],
          ),
        });
      });
      csvRow.push(...vals);
    });
    rows.push(csvRow);
  });
  return rows;
};

const convertPrismaValueToCsvValue = (
  columnName: string,
  value: any,
): string => {
  if (value === null || value === undefined) {
    return '';
  }
  // TODO other types?
  if (Decimal.isDecimal(value)) {
    return value.toString();
  }
  return `${value}`;
};
