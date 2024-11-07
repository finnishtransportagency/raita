import { jarjestelma, Prisma } from '@prisma/client';
import { MittausDbResult } from '../types';
import {
  mapMittausRowsToCsvRow,
  objectToCsvBody,
  objectToCsvHeader,
  writeDbChunkToStream,
} from '../utils';
import { PassThrough } from 'stream';

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

const testMittaus1: MittausDbResult = {
  id: 1,
  raportti_id: 1001,
  rata_kilometri: 1,
  rata_metrit: new Prisma.Decimal(1.0),
  geoviite_konvertoitu_rata_kilometri: 1,
  geoviite_konvertoitu_rata_metrit: new Prisma.Decimal(1.01),
  lat: new Prisma.Decimal(1),
  long: new Prisma.Decimal(2),
  track: 'track 1',
  jarjestelma: jarjestelma.OHL,
  siksak_1: new Prisma.Decimal(1),
  siksak_2: new Prisma.Decimal(1.2),
  korkeus_1: new Prisma.Decimal(12),
};
const testMittaus2: MittausDbResult = {
  id: 2,
  raportti_id: 1002,
  rata_kilometri: 1,
  rata_metrit: new Prisma.Decimal(1.0),
  geoviite_konvertoitu_rata_kilometri: 1,
  geoviite_konvertoitu_rata_metrit: new Prisma.Decimal(1.01),
  lat: new Prisma.Decimal(1),
  long: new Prisma.Decimal(2),
  track: 'track 1',
  jarjestelma: jarjestelma.OHL,
  siksak_1: new Prisma.Decimal(2),
  siksak_2: new Prisma.Decimal(2.2),
  korkeus_1: new Prisma.Decimal(123),
};
const differentRataosoiteMittaus: MittausDbResult = {
  id: 3,
  raportti_id: 1003,
  rata_kilometri: 123,
  rata_metrit: new Prisma.Decimal(1.0),
  geoviite_konvertoitu_rata_kilometri: 123,
  geoviite_konvertoitu_rata_metrit: new Prisma.Decimal(1),
  lat: new Prisma.Decimal(1),
  long: new Prisma.Decimal(2),
  track: 'track 1',
  jarjestelma: jarjestelma.OHL,
  siksak_1: new Prisma.Decimal(2),
  siksak_2: new Prisma.Decimal(2.2),
  korkeus_1: new Prisma.Decimal(123),
};
const mittausWithGeoviiteRataosoiteToRoundUp: MittausDbResult = {
  id: 4,
  raportti_id: 1001,
  rata_kilometri: 1,
  rata_metrit: new Prisma.Decimal(1.0),
  geoviite_konvertoitu_rata_kilometri: 1,
  geoviite_konvertoitu_rata_metrit: new Prisma.Decimal(0.88),
  lat: new Prisma.Decimal(1),
  long: new Prisma.Decimal(2),
  track: 'track 1',
  jarjestelma: jarjestelma.OHL,
  siksak_1: new Prisma.Decimal(1),
  siksak_2: new Prisma.Decimal(1.2),
  korkeus_1: new Prisma.Decimal(12),
};
const mittausWithGeoviiteRataosoiteToRoundDown: MittausDbResult = {
  id: 5,
  raportti_id: 1002,
  rata_kilometri: 1,
  rata_metrit: new Prisma.Decimal(1.0),
  geoviite_konvertoitu_rata_kilometri: 1,
  geoviite_konvertoitu_rata_metrit: new Prisma.Decimal(1.12),
  lat: new Prisma.Decimal(1),
  long: new Prisma.Decimal(2),
  track: 'track 1',
  jarjestelma: jarjestelma.OHL,
  siksak_1: new Prisma.Decimal(2),
  siksak_2: new Prisma.Decimal(2.2),
  korkeus_1: new Prisma.Decimal(123),
};
const mittausWithGeoviiteRataosoiteRoundedDifferently: MittausDbResult = {
  id: 5,
  raportti_id: 1002,
  rata_kilometri: 1,
  rata_metrit: new Prisma.Decimal(1.0),
  geoviite_konvertoitu_rata_kilometri: 1,
  geoviite_konvertoitu_rata_metrit: new Prisma.Decimal(1.13),
  lat: new Prisma.Decimal(1),
  long: new Prisma.Decimal(2),
  track: 'track 1',
  jarjestelma: jarjestelma.OHL,
  siksak_1: new Prisma.Decimal(2),
  siksak_2: new Prisma.Decimal(2.2),
  korkeus_1: new Prisma.Decimal(123),
};
describe('mapMittausRowsToCsvRows', () => {
  test('success: basic operation', () => {
    const mittausRows: MittausDbResult[] = [testMittaus1, testMittaus2];
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
      'MEERI_RATAOSOITE',
    );

    expect(res).toEqual([
      {
        header: 'Meeri rataosoite',
        value: '1+0001.00',
      },
      {
        header: 'date',
        value: '01.01.2023',
      },
      {
        header: 'Geoviite rataosoite 01.01.2023',
        value: '1+0001.01',
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
        header: 'Geoviite rataosoite 17.10.2024',
        value: '1+0001.01',
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
    const mittausRows: MittausDbResult[] = [testMittaus1, testMittaus2];
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
      'MEERI_RATAOSOITE',
    );

    expect(res).toEqual([
      {
        header: 'Meeri rataosoite',
        value: '1+0001.00',
      },
      {
        header: 'date',
        value: '01.01.2022',
      },
      {
        header: 'Geoviite rataosoite 01.01.2022',
        value: '',
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
        header: 'Geoviite rataosoite 01.01.2023',
        value: '1+0001.01',
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
        header: 'Geoviite rataosoite 17.10.2024',
        value: '1+0001.01',
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
      testMittaus1,
      testMittaus2,
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
      mapMittausRowsToCsvRow(
        mittausRows,
        raporttiRows,
        selectedColumns,
        'MEERI_RATAOSOITE',
      ),
    ).toThrow();
  });
  test('success: geoviite rataosoite rounding behaviour', () => {
    const mittausRows: MittausDbResult[] = [
      mittausWithGeoviiteRataosoiteToRoundUp,
      mittausWithGeoviiteRataosoiteToRoundDown,
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
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];

    const res = mapMittausRowsToCsvRow(
      mittausRows,
      raporttiRows,
      selectedColumns,
      'GEOVIITE_RATAOSOITE_ROUNDED',
    );
    expect(res).toEqual([
      {
        header: 'Geoviite rataosoite pyöristetty',
        value: '1+0001.00',
      },
      {
        header: 'date',
        value: '01.01.2023',
      },
      {
        header: 'Meeri rataosoite 01.01.2023',
        value: '1+0001.00',
      },
      {
        header: 'Geoviite rataosoite 01.01.2023',
        value: '1+0001.12',
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
        header: 'Meeri rataosoite 17.10.2024',
        value: '1+0001.00',
      },
      {
        header: 'Geoviite rataosoite 17.10.2024',
        value: '1+0000.88',
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
  test('success: geoviite rataosoite rounding behaviour', () => {
    const mittausRows: MittausDbResult[] = [
      mittausWithGeoviiteRataosoiteToRoundUp,
      mittausWithGeoviiteRataosoiteRoundedDifferently,
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
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];

    expect(() =>
      mapMittausRowsToCsvRow(
        mittausRows,
        raporttiRows,
        selectedColumns,
        'GEOVIITE_RATAOSOITE_ROUNDED',
      ),
    ).toThrow();
  });
});

describe('writeDbChunkToStream with MEERI_RATAOSOITE', () => {
  test('success: normal operation with Meeri rataosoite', () => {
    const mittausRows = [testMittaus1, testMittaus2];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const mockStream = new PassThrough();
    mockStream.write = jest.fn();
    const writeHeader = true;
    const raporttiInSystem = [
      { id: 1001, inspection_date: new Date('2024-01-01') },
      { id: 1002, inspection_date: new Date('2024-01-02') },
    ];
    writeDbChunkToStream(
      mittausRows,
      selectedColumns,
      mockStream,
      writeHeader,
      raporttiInSystem,
      'MEERI_RATAOSOITE',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      'Meeri rataosoite;date;Geoviite rataosoite 01.01.2024;siksak_1 01.01.2024;korkeus_1 01.01.2024;date;Geoviite rataosoite 02.01.2024;siksak_1 02.01.2024;korkeus_1 02.01.2024\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '1+0001.00;01.01.2024;1+0001.01;1;12;02.01.2024;1+0001.01;2;123\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledTimes(2);
  });
  test('success: some missing entries', () => {
    const mittausRows = [
      testMittaus1,
      testMittaus2,
      differentRataosoiteMittaus,
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const mockStream = new PassThrough();
    mockStream.write = jest.fn();
    const writeHeader = true;
    const raporttiInSystem = [
      { id: 1001, inspection_date: new Date('2024-01-01') },
      { id: 1002, inspection_date: new Date('2024-01-02') },
      { id: 1003, inspection_date: new Date('2024-01-02') },
    ];
    writeDbChunkToStream(
      mittausRows,
      selectedColumns,
      mockStream,
      writeHeader,
      raporttiInSystem,
      'MEERI_RATAOSOITE',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      'Meeri rataosoite;date;Geoviite rataosoite 01.01.2024;siksak_1 01.01.2024;korkeus_1 01.01.2024;date;Geoviite rataosoite 02.01.2024;siksak_1 02.01.2024;korkeus_1 02.01.2024;date;Geoviite rataosoite 02.01.2024;siksak_1 02.01.2024;korkeus_1 02.01.2024\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '1+0001.00;01.01.2024;1+0001.01;1;12;02.01.2024;1+0001.01;2;123;02.01.2024;;;\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '123+0001.00;01.01.2024;;;;02.01.2024;;;;02.01.2024;123+0001.00;2;123\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledTimes(3);
  });
  test('success: duplicate mittaus', () => {
    const mittausRows = [testMittaus1, testMittaus2, testMittaus1];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const mockStream = new PassThrough();
    mockStream.write = jest.fn();
    const writeHeader = true;
    const raporttiInSystem = [
      { id: 1001, inspection_date: new Date('2024-01-01') },
      { id: 1002, inspection_date: new Date('2024-01-02') },
    ];
    writeDbChunkToStream(
      mittausRows,
      selectedColumns,
      mockStream,
      writeHeader,
      raporttiInSystem,
      'MEERI_RATAOSOITE',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      'Meeri rataosoite;date;Geoviite rataosoite 01.01.2024;siksak_1 01.01.2024;korkeus_1 01.01.2024;date;Geoviite rataosoite 02.01.2024;siksak_1 02.01.2024;korkeus_1 02.01.2024\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '1+0001.00;01.01.2024;1+0001.01;1;12;02.01.2024;1+0001.01;2;123\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '1+0001.00;01.01.2024;1+0001.01;1;12;02.01.2024;;;\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledTimes(3);
  });
});

describe('writeDbChunkToStream with GEOVIITE_RATAOSOITE_ROUNDED', () => {
  test('success: normal operation with geoviite rataosoite rounded', () => {
    const mittausRows = [testMittaus1, testMittaus2];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const mockStream = new PassThrough();
    mockStream.write = jest.fn();
    const writeHeader = true;
    const raporttiInSystem = [
      { id: 1001, inspection_date: new Date('2024-01-01') },
      { id: 1002, inspection_date: new Date('2024-01-02') },
    ];
    writeDbChunkToStream(
      mittausRows,
      selectedColumns,
      mockStream,
      writeHeader,
      raporttiInSystem,
      'GEOVIITE_RATAOSOITE_ROUNDED',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      'Geoviite rataosoite pyöristetty;date;Meeri rataosoite 01.01.2024;Geoviite rataosoite 01.01.2024;siksak_1 01.01.2024;korkeus_1 01.01.2024;date;Meeri rataosoite 02.01.2024;Geoviite rataosoite 02.01.2024;siksak_1 02.01.2024;korkeus_1 02.01.2024\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '1+0001.00;01.01.2024;1+0001.00;1+0001.01;1;12;02.01.2024;1+0001.00;1+0001.01;2;123\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledTimes(2);
  });
  test('success: geoviite rataosoite rounded with different rataosoite that round to the same', () => {
    const mittausRows = [
      mittausWithGeoviiteRataosoiteToRoundUp,
      mittausWithGeoviiteRataosoiteToRoundDown,
    ];
    const selectedColumns = ['siksak_1', 'korkeus_1'];
    const mockStream = new PassThrough();
    mockStream.write = jest.fn();
    const writeHeader = true;
    const raporttiInSystem = [
      { id: 1001, inspection_date: new Date('2024-01-01') },
      { id: 1002, inspection_date: new Date('2024-01-02') },
    ];
    writeDbChunkToStream(
      mittausRows,
      selectedColumns,
      mockStream,
      writeHeader,
      raporttiInSystem,
      'GEOVIITE_RATAOSOITE_ROUNDED',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      'Geoviite rataosoite pyöristetty;date;Meeri rataosoite 01.01.2024;Geoviite rataosoite 01.01.2024;siksak_1 01.01.2024;korkeus_1 01.01.2024;date;Meeri rataosoite 02.01.2024;Geoviite rataosoite 02.01.2024;siksak_1 02.01.2024;korkeus_1 02.01.2024\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledWith(
      '1+0001.00;01.01.2024;1+0001.00;1+0000.88;1;12;02.01.2024;1+0001.00;1+0001.12;2;123\r\n',
      'utf8',
    );
    expect(mockStream.write).toHaveBeenCalledTimes(2);
  });
});
