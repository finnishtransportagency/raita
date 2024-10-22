import { jarjestelma, Prisma } from '@prisma/client';
import { MittausDbResult } from '../types';
import {
  mapMittausRowsToCsvRow,
  objectToCsvBody,
  objectToCsvHeader,
} from '../utils';

const testData = [
  [
    {
      header: 'test1',
      value: 'z',
    },
    {
      header: 'date',
      value: 'foo',
    },
    {
      header: 'variable1',
      value: 'bar',
    },
    {
      header: 'test2',
      value: 'baz',
    },
  ],
  [
    {
      header: 'test1',
      value: 'z',
    },
    {
      header: 'date',
      value: '2',
    },
    {
      header: 'variable1',
      value: '3',
    },
    {
      header: 'test2',
      value: '4',
    },
  ],
  [
    {
      header: 'test1',
      value: 'z',
    },
    {
      header: 'date',
      value: 'b',
    },
    {
      header: 'variable1',
      value: 'a',
    },
    {
      header: 'test2',
      value: 'c',
    },
  ],
];
const headerString = 'test1;date;variable1;test2\r\n';
const bodyString = 'z;foo;bar;baz\r\n' + 'z;2;3;4\r\n' + 'z;b;a;c\r\n';
const csvString =
  'test1;date;variable1;test2\r\n' +
  'z;foo;bar;baz\r\n' +
  'z;2;3;4\r\n' +
  'z;b;a;c\r\n';
describe('objectToCsvHeader', () => {
  test('success: basic operation', () => {
    const header = objectToCsvHeader(testData[0]);
    expect(header).toEqual(headerString);
  });
});
describe('objectToCsvBody', () => {
  test('success: basic operation', () => {
    const body = objectToCsvBody(testData);
    expect(body).toEqual(bodyString);
  });
});
describe('objectToCsvHeader and objectToCsvBody', () => {
  test('success: basic operation', () => {
    // important to make sure header ans body columns are aligned
    const header = objectToCsvHeader(testData[0]);
    const body = objectToCsvBody(testData);
    expect(header + body).toEqual(csvString);
  });
});

describe('mapMittausRowsToCsvRows', () => {
  const mittaus1: MittausDbResult = {
    id: 1,
    raportti_id: 1001,
    rata_kilometri: 1,
    rata_metrit: new Prisma.Decimal(1.0),
    lat: new Prisma.Decimal(1),
    long: new Prisma.Decimal(2),
    track: 'track 1',
    jarjestelma: jarjestelma.OHL,
    siksak_1: new Prisma.Decimal(1),
    siksak_2: new Prisma.Decimal(1.2),
    korkeus_1: new Prisma.Decimal(12),
  };
  const mittaus2: MittausDbResult = {
    id: 2,
    raportti_id: 1002,
    rata_kilometri: 1,
    rata_metrit: new Prisma.Decimal(1.0),
    lat: new Prisma.Decimal(1),
    long: new Prisma.Decimal(2),
    track: 'track 1',
    jarjestelma: jarjestelma.OHL,
    siksak_1: new Prisma.Decimal(2),
    siksak_2: new Prisma.Decimal(2.2),
    korkeus_1: new Prisma.Decimal(123),
  };
  const differentRataosoiteMittaus: MittausDbResult = {
    id: 2,
    raportti_id: 1003,
    rata_kilometri: 123,
    rata_metrit: new Prisma.Decimal(1.0),
    lat: new Prisma.Decimal(1),
    long: new Prisma.Decimal(2),
    track: 'track 1',
    jarjestelma: jarjestelma.OHL,
    siksak_1: new Prisma.Decimal(2),
    siksak_2: new Prisma.Decimal(2.2),
    korkeus_1: new Prisma.Decimal(123),
  };

  test('success: basic operation', () => {
    const mittausRows: MittausDbResult[] = [mittaus1, mittaus2];
    const raporttiRows = [
      {
        id: 1001,
        inspection_date: new Date('2024-10-17'),
      },
      {
        id: 1002,
        inspection_date: new Date('2023-01-01'),
      },
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const res = mapMittausRowsToCsvRow(
      mittausRows,
      raporttiRows,
      selectedColumns,
    );

    expect(res).toEqual([
      {
        header: 'rataosoite',
        value: '1+0001.00',
      },
      {
        header: 'date',
        value: '01.01.2023',
      },
      {
        header: 'siksak_1 01.01.2023',
        value: '2',
      },
      {
        header: 'korkeus_1 01.01.2023',
        value: '123',
      },
      {
        header: 'date',
        value: '17.10.2024',
      },
      {
        header: 'siksak_1 17.10.2024',
        value: '1',
      },
      {
        header: 'korkeus_1 17.10.2024',
        value: '12',
      },
    ]);
  });
  test('success: missing mittaus for one raportti', () => {
    const mittausRows: MittausDbResult[] = [mittaus1, mittaus2];
    const raporttiRows = [
      {
        id: 1001,
        inspection_date: new Date('2024-10-17'),
      },
      {
        id: 1002,
        inspection_date: new Date('2023-01-01'),
      },
      {
        id: 1003, // missing in data
        inspection_date: new Date('2022-01-01'),
      },
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const res = mapMittausRowsToCsvRow(
      mittausRows,
      raporttiRows,
      selectedColumns,
    );

    expect(res).toEqual([
      {
        header: 'rataosoite',
        value: '1+0001.00',
      },
      {
        header: 'date',
        value: '01.01.2022',
      },
      {
        header: 'siksak_1 01.01.2022',
        value: '',
      },
      {
        header: 'korkeus_1 01.01.2022',
        value: '',
      },
      {
        header: 'date',
        value: '01.01.2023',
      },
      {
        header: 'siksak_1 01.01.2023',
        value: '2',
      },
      {
        header: 'korkeus_1 01.01.2023',
        value: '123',
      },
      {
        header: 'date',
        value: '17.10.2024',
      },
      {
        header: 'siksak_1 17.10.2024',
        value: '1',
      },
      {
        header: 'korkeus_1 17.10.2024',
        value: '12',
      },
    ]);
  });
  test('error: different rataosoite', () => {
    const mittausRows: MittausDbResult[] = [
      mittaus1,
      mittaus2,
      differentRataosoiteMittaus,
    ];
    const raporttiRows = [
      {
        id: 1001,
        inspection_date: new Date('2024-10-17'),
      },
      {
        id: 1002,
        inspection_date: new Date('2023-01-01'),
      },
      {
        id: 1003, // missing in data
        inspection_date: new Date('2022-01-01'),
      },
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];

    expect(() =>
      mapMittausRowsToCsvRow(mittausRows, raporttiRows, selectedColumns),
    ).toThrow();
  });
});
