import * as CSV from 'csv-string';
import { CsvRow, MittausDbResult } from './types';
import { Decimal } from '@prisma/client/runtime/library';
import { compareAsc, format } from 'date-fns';
import { log } from '../../../utils/logger';
import { Writable } from 'stream';

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

/**
 * Write the given mittausRows to a writable stream, with mittaus entries from the same rataosoite combined on the same row. Adds every column in selectedColumns to the csv for each raportti entry.
 *
 * TODO: some other way to combine mittaus data in the same row?
 *
 * @param mittausRows This needs to be sorted by rata_kilometri and rata_metrit
 * @param selectedColumns List of column names that should appear in the csv per mittaus. Some values added by default: rataosoite for each row, date for each mittaus
 * @param outputStream
 * @param writeHeader Should csv header be written in the first row?
 * @param raporttiInSystem List of raportti entries that are related to the mittausRows. For each entry in this list, the columns according to selectedColumns are added to the result.
 */
export const writeDbChunkToStream = (
  mittausRows: MittausDbResult[],
  selectedColumns: string[],
  outputStream: Writable,
  writeHeader: boolean,
  raporttiInSystem: { id: number; inspection_date: Date | null }[],
) => {
  let mittausRowIndex = 0;
  while (mittausRowIndex < mittausRows.length) {
    const mittaus = mittausRows[mittausRowIndex];
    const rataosoite = getRataosoite(mittaus);
    // array is sorted by rataosoite
    // get mittaus rows with same rataosoite from rowStart (inclusive) to rowEnd(exclusive)
    const rowStart = mittausRowIndex;
    let rowEnd = rowStart + 1;
    while (
      rowEnd < mittausRows.length &&
      getRataosoite(mittausRows[rowEnd]) === rataosoite
    ) {
      rowEnd++;
    }
    const sameRataosoite: MittausDbResult[] = mittausRows.slice(
      rowStart,
      rowEnd,
    );
    // check if there are duplicates: same rataosoite from the same raportti
    // these will be put in separate rows
    let duplicates: MittausDbResult[] = [];
    let nonDuplicates: MittausDbResult[] = [];
    sameRataosoite.forEach(mittaus => {
      if (
        nonDuplicates.filter(m => m.raportti_id === mittaus.raportti_id).length
      ) {
        duplicates.push(mittaus);
      } else {
        nonDuplicates.push(mittaus);
      }
    });
    // convert rows of same rataosoite to a single csv row
    const row: CsvRow = mapMittausRowsToCsvRow(
      nonDuplicates,
      raporttiInSystem,
      selectedColumns,
    );
    if (writeHeader && rowStart === 0) {
      outputStream.write(objectToCsvHeader(row), 'utf8');
    }
    outputStream.write(objectToCsvBody([row]), 'utf8');
    // put each duplicate into its own row
    duplicates.forEach(mittaus => {
      const duplicateRow: CsvRow = mapMittausRowsToCsvRow(
        [mittaus],
        raporttiInSystem,
        selectedColumns,
      );
      outputStream.write(objectToCsvBody([duplicateRow]), 'utf8');
    });
    mittausRowIndex = rowEnd;
  }
};
