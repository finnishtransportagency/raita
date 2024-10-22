import * as CSV from 'csv-string';
import { CsvRow, MittausDbResult } from './types';
import { Decimal } from '@prisma/client/runtime/library';
import { compareAsc, format } from 'date-fns';
import { log } from '../../../utils/logger';

const separator = ';';

export const objectToCsvHeader = (row: CsvRow) => {
  const csvHeader = row.map(column => column.header);
  return CSV.stringify(csvHeader, separator);
};

export const objectToCsvBody = (rows: CsvRow[]) => {
  const bodyRows = rows.map(row => row.map(column => column.value));
  if (!bodyRows || bodyRows.length === 0) {
    log.error(bodyRows);
  }
  const res = CSV.stringify(bodyRows, separator);
  if (!res) {
    log.error({ res }, 'empty csv body');
  }
  return res;
};

/**
 * Map mittaus entries for one rataosoite into one csv row
 * All mittausRows entries should have same rataosoite
 *
 * raporttiRows should have an entry for each raportti that can be in the data
 * mittausRows should have one or zero mittaus entries for each raportti
 */
export const mapMittausRowsToCsvRow = (
  mittausRows: MittausDbResult[],
  raporttiRows: { id: number; inspection_date: Date | null }[],
  selectedColumns: string[],
): CsvRow => {
  if (mittausRows.length === 0) {
    return [];
  }
  const rata_kilometri = mittausRows[0].rata_kilometri;
  const rata_metrit = mittausRows[0].rata_metrit;
  mittausRows.forEach(mittaus => {
    if (
      mittaus.rata_kilometri !== rata_kilometri ||
      mittaus.rata_metrit?.toString() !== rata_metrit?.toString()
    ) {
      throw new Error('All mittaus rows should have same rataosoite');
    }
  });

  const raporttiSorted = [...raporttiRows].sort((a, b) =>
    compareAsc(a.inspection_date ?? 0, b.inspection_date ?? 0),
  );

  const csvRow: CsvRow = [
    {
      header: 'rataosoite',
      value: getRataosoite(mittausRows[0]),
    },
  ];

  raporttiSorted.forEach(raportti => {
    const mittaus = mittausRows.find(r => r.raportti_id === raportti.id);
    // data might be missing for some raportti
    // if mittaus is undefined, still add values but as empty strings
    const date = raportti.inspection_date
      ? format(raportti.inspection_date, 'dd.MM.yyyy')
      : 'missing_date';
    const vals: CsvRow = [
      {
        header: 'date',
        value: date,
      },
    ];
    selectedColumns.forEach(columnName => {
      const mittausAsObj: { [key: string]: any } = { ...mittaus };

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
  return csvRow;
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

/**
 * Get rataosoite from mittaus row, in the same format as in the original csv
 */
export const getRataosoite = (mittaus: MittausDbResult) => {
  const rata_kilometri = mittaus.rata_kilometri;
  const rata_metrit = mittaus.rata_metrit;
  return `${rata_kilometri ?? ''}+${
    rata_metrit
      ? Intl.NumberFormat('en', {
          minimumIntegerDigits: 4,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: false,
        }).format(rata_metrit.toNumber())
      : ''
  }`;
};
