 import { GeoviiteClient } from '../geoviiteClient';

import { log } from '../../../utils/logger';
import { Decimal } from 'prisma/prisma-client/runtime/library';
import { jest } from '@jest/globals';

import {produceGeoviiteBatchUpdateSql, produceGeoviiteBatchUpdateSql2} from '../../dataProcess/csvCommon/db/dbUtil';
import { Prisma } from '@prisma/client';
import {getPrismaClient} from "../../../utils/prismaClient";

const client = new GeoviiteClient('https://xxxxxxxxx.yy/');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('geoviite single point with default params', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');

    try {
      const converted = await client.getConvertedTrackAddressWithCoords(
        61.9241,
        25.7482,
      );
    } catch (error) {
      //testing our api request format; response error ignored
    }

    const loggings = logSpy.mock.calls.map(call => call.toString());

    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?koordinaatisto=EPSG%3A4258',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes('Post data: [{"x":25.7482,"y":61.9241}]'),
    ).toBeTruthy();
  });
});

describe('geoviite single point with a custom path param and extra post params', () => {
  test('success: basic operation', async () => {
    const extraPathParams = {
      geometriatiedot: true,
      koordinaatisto: 'EPSG:3067',
    };

    const extraPostParams = {
      ratanumero: undefined,
      sade: 120,
      sijaintiraide: undefined,
      sijaintiraide_tyyppi: undefined,
    };

    const logSpy = jest.spyOn(log, 'trace');
    try {
      const converted = await client.getConvertedTrackAddressWithCoords(
        619241,
        257482,
        extraPathParams,
        extraPostParams,
      );
    } catch (error) {
      //testing our api request format; response error ignored
    }

    const loggings = logSpy.mock.calls.map(call => call.toString());

    log.info(loggings);
    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?geometriatiedot=true&koordinaatisto=EPSG:3067',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes('Post data: [{"x":257482,"y":619241,"sade":120}]'),
    ).toBeTruthy();
  });
});

describe('geoviite single point with two custom path params', () => {
  test('success: basic operation', async () => {
    const extraPathParams = {
      geometriatiedot: true,
      lisatiedot: false,
      perustiedot: undefined,
    };

    const logSpy = jest.spyOn(log, 'trace');
    try {
      const converted = await client.getConvertedTrackAddressWithCoords(
        61.9241,
        25.7482,
        extraPathParams,
      );
    } catch (error) {
      //testing our api request format; response error ignored
    }

    const loggings = logSpy.mock.calls.map(call => call.toString());

    log.info(loggings);
    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?geometriatiedot=true&lisatiedot=false',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes('Post data: [{"x":25.7482,"y":61.9241}]'),
    ).toBeTruthy();
  });
});

describe('geoviite multiple points with default params', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');
    const points: Array<{ lat: number; long: number }> = [
      { lat: 61.9241, long: 25.7482 },
      { lat: 61.5641, long: 24.7182 },
      { lat: 61.1231, long: 25.1482 },
    ];

    try {
      const converted =
        await client.getConvertedTrackAddressesWithCoords(points);
      log.info(converted, 'converted');
    } catch (error) {
      //testing our api request format; response error ignored
    }
    const loggings = logSpy.mock.calls.map(call => call.toString());

    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?koordinaatisto=EPSG%3A4258',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x":25.7482,"y":61.9241},{"x":24.7182,"y":61.5641},{"x":25.1482,"y":61.1231}]',
      ),
    ).toBeTruthy();
  });
});

describe('geoviite multiple points with Prisma coords', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');
    const points: Array<{ lat: Decimal; long: Decimal; id: number }> = [
      { lat: new Decimal(61.9241), long: new Decimal(25.7482), id: 123 },
      { lat: new Decimal(61.5641), long: new Decimal(24.7182), id: 124 },
      { lat: new Decimal(61.1231), long: new Decimal(25.1482), id: 125 },
    ];

    try {
      const converted =
        await client.getConvertedTrackAddressesWithPrismaCoords(points);
      log.info(converted, 'converted');
    } catch (error) {
      //testing our api request format; response error ignored
    }
    const loggings = logSpy.mock.calls.map(call => call.toString());

    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?koordinaatisto=EPSG%3A4258',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x":25.7482,"y":61.9241},{"x":24.7182,"y":61.5641},{"x":25.1482,"y":61.1231}]',
      ),
    ).toBeTruthy();
  });
});

describe('geoviite multiple points with extra params', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');

    const extraPathParams = {
      koordinaatisto: 'testCoordSystem',
      geometriatiedot: true,
      lisatiedot: false,
      perustiedot: undefined,
    };

    const extraPostParams = {
      ratanumero: undefined,
      sade: 120,
      sijaintiraide: undefined,
      sijaintiraide_tyyppi: undefined,
    };

    const points: Array<{ lat: number; long: number }> = [
      { lat: 61.9241, long: 25.7482 },
      { lat: 61.5641, long: 24.7182 },
      { lat: 61.1231, long: 25.1482 },
    ];

    try {
      const converted = await client.getConvertedTrackAddressesWithCoords(
        points,
        extraPathParams,
        extraPostParams,
      );
      log.info(converted, 'converted');
    } catch (error) {
      //testing our api request format; response error ignored
    }
    const loggings = logSpy.mock.calls.map(call => call.toString());

    log.info(loggings);
    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?geometriatiedot=true&lisatiedot=false&koordinaatisto=testCoordSystem',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x":25.7482,"y":61.9241,"sade":120},{"x":24.7182,"y":61.5641,"sade":120},{"x":25.1482,"y":61.1231,"sade":120}]',
      ),
    ).toBeTruthy();
  });
});

describe('geoviite parse sql from repsonse', () => {
  test('success: basic operation', async () => {
    const sql = produceGeoviiteBatchUpdateSql2(
      [
        {
          x: 259348.20489785323,
          y: 6804094.514968412,
          valimatka: 2.0372681319713593e-10,
          ratanumero: '002',
          sijaintiraide: '002',
          sijaintiraide_kuvaus: 'Lielahti-Kokemäki-Pori-Mäntyluoto',
          sijaintiraide_tyyppi: 'pääraide',
          ratakilometri: 270,
          ratametri: 300,
          ratametri_desimaalit: 0,
          ratanumero_oid: '1.2.246.578.3.10001.188908',
          sijaintiraide_oid: '1.2.246.578.3.10002.194079',
          id: 3087679,
        },
        {
          x: 245348.20489785323,
          y: 6704094.514968412,
          valimatka: 1.0372681319713593e-10,
          ratanumero: '001',
          sijaintiraide: '003',
          sijaintiraide_kuvaus: 'Vielahti-Kokemäki-Pori-Mäntyluoto',
          sijaintiraide_tyyppi: 'sivuraide',
          ratakilometri: 170,
          ratametri: 200,
          ratametri_desimaalit: 123,
          ratanumero_oid: '1.2.246.578.3.10001.188901',
          sijaintiraide_oid: '1.2.246.578.3.10002.194071',
          id: 3087680,
        },
      ],
      '2024-01-01T01:11:00.000Z',
      'AMS'
    );

    const prisma = await getPrismaClient();
    console.log(sql);
    const a= await prisma.$executeRaw(sql);
    console.log(a);

    expect(sql).toEqual(
      "UPDATE AMS_mittaus SET geoviite_konvertoitu_long = CASE when id in (27562774) then 259348.20489785323 when id in (27562775) then 245348.20489785323 END, geoviite_konvertoitu_lat = CASE when id in (27562774) then 6804094.514968412 when id in (27562775) then 6704094.514968412 END, geoviite_konvertoitu_rataosuus_numero = CASE when id in (27562774) then '002' when id in (27562775) then '001' END, geoviite_konvertoitu_rata_kilometri = CASE when id in (27562774) then 6804094.514968412 when id in (27562775) then 6704094.514968412 END, geoviite_konvertoitu_rata_metrit = CASE when id in (27562774) then 300 when id in (27562775) then 200.123 END, geoviite_konvertoitu_rataosuus_nimi = CASE when id in (27562774) then null when id in (27562775) then null END, geoviite_konvertoitu_raide_numero = CASE when id in (27562774) then null when id in (27562775) then null END, geoviite_valimatka = CASE when id in (27562774) then 2.0372681319713593e-10 when id in (27562775) then 1.0372681319713593e-10 END, geoviite_sijaintiraide = CASE when id in (27562774) then '002' when id in (27562775) then '003' END, geoviite_sijaintiraide_kuvaus = CASE when id in (27562774) then 'Lielahti-Kokemäki-Pori-Mäntyluoto' when id in (27562775) then 'Vielahti-Kokemäki-Pori-Mäntyluoto' END, geoviite_sijaintiraide_tyyppi = CASE when id in (27562774) then 'pääraide' when id in (27562775) then 'sivuraide' END, geoviite_sijaintiraide_oid = CASE when id in (27562774) then '1.2.246.578.3.10002.194079' when id in (27562775) then '1.2.246.578.3.10002.194071' END, geoviite_ratanumero_oid = CASE when id in (27562774) then '1.2.246.578.3.10001.188908' when id in (27562775) then '1.2.246.578.3.10001.188901' END, geoviite_virhe = CASE when id in (27562774) then null when id in (27562775) then null END, geoviite_updated_at =  '2024-01-01T01:11:00.000Z' WHERE id IN (27562774,27562775);",
    );
  });
});

describe('geoviite parse sql from response with virhe', () => {
  test('success: basic operation', async () => {

    const prisma = await getPrismaClient();

    // Example is safe if the text query below is completely trusted content
    const query1 = `SELECT id FROM "mittaus" WHERE track = ` // The first parameter would be inserted after this string
    const query2 = ` OR track = ` // The second parameter would be inserted after this string

    const inputString1 = "Fred"
    const inputString2 = `'Sarah' UNION SELECT id, title FROM "Post"`
    const vals = [];
    vals.push(inputString1);
    vals.push(inputString2);
    const query = Prisma.sql([query1, query2, ""], ...vals)

    console.log(query);
    const a= await prisma.$executeRaw(query);
    console.log(a);

  });
});

 describe('geoviite parse sql from reponsse with virhe', () => {
   test('success: basicfd operation', async () => {

     const prisma = await getPrismaClient();
/*

     UPDATE kalle.AMS_mittaus SET geoviite_konvertoitu_long = CASE
     when id in (27562774) then 259348.20489785323
     when id in (27562775) then 245348.20489785323 END,
       geoviite_konvertoitu_lat = CASE
     when id in (27562774) then 6804094.514968412
     when id in (27562775) then 6704094.514968412 END,
       geoviite_konvertoitu_rataosuus_numero = CASE
     when id in (27562774) then '002'
     when id in (27562775) then '001' END,
       geoviite_konvertoitu_rata_kilometri = CASE*/
     const querys = [
       `UPDATE ams_mittaus SET geoviite_konvertoitu_long = CASE when id = `,
       ` then `,
       ` when id = `,
       ` then `,
       ` END, geoviite_konvertoitu_rataosuus_numero = CASE when id = `,
       ` then `,
       ` when id = `,
       ` then `,
       ` END WHERE id  = `,
       ` OR id  = `,
       ""
     ];


     const vals =
       [
         3087679,
         159348.20489785323,
         3087680,
         259348.20489785323,
         3087679,
         'HELLO',
         3087680,
         null,
         3087679,
         3087680,
       ];
     const query = Prisma.sql(querys, ...vals)
     console.log(query);
     const a= await prisma.$executeRaw(query);
     console.log(a);

   });
 });


 describe('geoviite parse sql from repsonse with virhe', () => {
   test('success: basic operation', async () => {
     const sql = produceGeoviiteBatchUpdateSql2(
       [
         {
           x: 259348.20489785323,
           y: 6804094.514968412,
           valimatka: 2.0372681319713593e-10,
           ratanumero: '002',
           sijaintiraide: '002',
           sijaintiraide_kuvaus: 'Lielahti-Kokemäki-Pori-Mäntyluoto',
           sijaintiraide_tyyppi: 'pääraide',
           ratakilometri: 270,
           ratametri: 300,
           ratametri_desimaalit: 0,
           ratanumero_oid: '1.2.246.578.3.10001.188901',
           sijaintiraide_oid: '1.2.246.578.3.10002.194071',
           id: 27562774,
         },
         {
           x: 245348.20489785323,
           y: 6704094.514968412,
           valimatka: 1.0372681319713593e-10,
           ratanumero: '001',
           sijaintiraide: '003',
           sijaintiraide_kuvaus: 'Vielahti-Kokemäki-Pori-Mäntyluoto',
           sijaintiraide_tyyppi: 'sivuraide',
           ratakilometri: 170,
           ratametri: 200,
           ratametri_desimaalit: 123,
           ratanumero_oid: '1.2.246.578.3.10001.188902',
           sijaintiraide_oid: '1.2.246.578.3.10002.194072',
           id: 27562775,
         },
         {
           virheet: [
             'virhe1',
             'virhe2',
             'virhe45678901294876gb,2390483487584u39htgrln 34984utjgm03498trj34098n384993849y43890uj',
           ],
           id: 27562776,
         },
       ],
       '2024-01-01T01:11:00.000Z',
       'AMS'
     );
     console.log(sql);
     const prisma = await getPrismaClient();
     const a= await prisma.$executeRaw(sql);
     console.log(a);

     expect(sql).toEqual(
       "UPDATE AMS_mittaus SET geoviite_konvertoitu_long = CASE when id in (27562774) then 259348.20489785323 when id in (27562775) then 245348.20489785323 when id in (27562776) then cast(null as numeric) END, geoviite_konvertoitu_lat = CASE when id in (27562774) then 6804094.514968412 when id in (27562775) then 6704094.514968412 when id in (27562776) then cast(null as numeric) END, geoviite_konvertoitu_rataosuus_numero = CASE when id in (27562774) then '002' when id in (27562775) then '001' when id in (27562776) then null END, geoviite_konvertoitu_rata_kilometri = CASE when id in (27562774) then 6804094.514968412 when id in (27562775) then 6704094.514968412 when id in (27562776) then cast(null as numeric) END, geoviite_konvertoitu_rata_metrit = CASE when id in (27562774) then 300 when id in (27562775) then 200.123 when id in (27562776) then cast(null as numeric) END, geoviite_konvertoitu_rataosuus_nimi = CASE when id in (27562774) then null when id in (27562775) then null when id in (27562776) then null END, geoviite_konvertoitu_raide_numero = CASE when id in (27562774) then null when id in (27562775) then null when id in (27562776) then null END, geoviite_valimatka = CASE when id in (27562774) then 2.0372681319713593e-10 when id in (27562775) then 1.0372681319713593e-10 when id in (27562776) then cast(null as numeric) END, geoviite_sijaintiraide = CASE when id in (27562774) then '002' when id in (27562775) then '003' when id in (27562776) then null END, geoviite_sijaintiraide_kuvaus = CASE when id in (27562774) then 'Lielahti-Kokemäki-Pori-Mäntyluoto' when id in (27562775) then 'Vielahti-Kokemäki-Pori-Mäntyluoto' when id in (27562776) then null END, geoviite_sijaintiraide_tyyppi = CASE when id in (27562774) then 'pääraide' when id in (27562775) then 'sivuraide' when id in (27562776) then null END, geoviite_sijaintiraide_oid = CASE when id in (27562774) then '1.2.246.578.3.10002.194071' when id in (27562775) then '1.2.246.578.3.10002.194072' when id in (27562776) then null END, geoviite_ratanumero_oid = CASE when id in (27562774) then '1.2.246.578.3.10001.188901' when id in (27562775) then '1.2.246.578.3.10001.188902' when id in (27562776) then null END, geoviite_virhe = CASE when id in (27562774) then null when id in (27562775) then null when id in (27562776) then 'virhe1,virhe2,virhe45678901294876gb,2390483487584u39htgrln 34984utjgm03498trj34098n384993849y43890uj' END, geoviite_updated_at =  '2024-01-01T01:11:00.000Z' WHERE id IN (27562774,27562775,27562776);",
     );
   });
 });


