import { GeoviiteClient } from '../geoviiteClient';

import { log } from '../../../utils/logger';
import { Decimal } from 'prisma/prisma-client/runtime/library';
import { jest } from '@jest/globals';

import { produceGeoviiteBatchUpdateSql } from '../../dataProcess/csvCommon/db/dbUtil';
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

describe('geoviite parse sql from response', () => {
  test('success: basic operation', async () => {
    const sql = produceGeoviiteBatchUpdateSql(
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
      new Date(2024, 12, 24),
      'AMS',
      false,
    );

    expect(sql).toEqual({
      strings: [
        'UPDATE ams_mittaus SET geoviite_konvertoitu_long = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_lat = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rataosuus_numero = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rataosuus_nimi = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rata_kilometri = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rata_metrit= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_raide_numero = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_valimatka= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_kuvaus = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_tyyppi = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_oid = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_ratanumero_oid = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_virhe = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_updated_at = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END WHERE id = ',
        ' OR id = ',
        '',
      ],
      values: [
        3087679,
        259348.20489785323,
        3087680,
        245348.20489785323,
        3087679,
        6804094.514968412,
        3087680,
        6704094.514968412,
        3087679,
        '002',
        3087680,
        '001',
        3087679,
        null,
        3087680,
        null,
        3087679,
        270,
        3087680,
        170,
        3087679,
        300,
        3087680,
        200.123,
        3087679,
        null,
        3087680,
        null,
        3087679,
        2.0372681319713593e-10,
        3087680,
        1.0372681319713593e-10,
        3087679,
        '002',
        3087680,
        '003',
        3087679,
        'Lielahti-Kokemäki-Pori-Mäntyluoto',
        3087680,
        'Vielahti-Kokemäki-Pori-Mäntyluoto',
        3087679,
        'pääraide',
        3087680,
        'sivuraide',
        3087679,
        '1.2.246.578.3.10002.194079',
        3087680,
        '1.2.246.578.3.10002.194071',
        3087679,
        '1.2.246.578.3.10001.188908',
        3087680,
        '1.2.246.578.3.10001.188901',
        3087679,
        null,
        3087680,
        null,
        3087679,
        new Date(2024, 12, 24),
        3087680,
        new Date(2024, 12, 24),
        3087679,
        3087680,
      ],
    });
  });
});

describe('geoviite parse sql from response with virhe', () => {
  test('success: basic operation', async () => {
    const sql = produceGeoviiteBatchUpdateSql(
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
      new Date(2024, 12, 24),
      'AMS',
      false,
    );


    const prisma = await getPrismaClient();
    //console.log(sql);
    const a= await prisma.$executeRaw(sql);
    console.log(a);

/*
    expect(sql).toEqual({
      values: [
        27562774,
        259348.20489785323,
        27562775,
        245348.20489785323,
        27562776,
        undefined,
        27562774,
        6804094.514968412,
        27562775,
        6704094.514968412,
        27562776,
        undefined,
        27562774,
        '002',
        27562775,
        '001',
        27562776,
        undefined,
        27562774,
        null,
        27562775,
        null,
        27562776,
        null,
        27562774,
        270,
        27562775,
        170,
        27562776,
        undefined,
        27562774,
        300,
        27562775,
        200.123,
        27562776,
        null,
        27562774,
        null,
        27562775,
        null,
        27562776,
        null,
        27562774,
        2.0372681319713593e-10,
        27562775,
        1.0372681319713593e-10,
        27562776,
        undefined,
        27562774,
        '002',
        27562775,
        '003',
        27562776,
        undefined,
        27562774,
        'Lielahti-Kokemäki-Pori-Mäntyluoto',
        27562775,
        'Vielahti-Kokemäki-Pori-Mäntyluoto',
        27562776,
        undefined,
        27562774,
        'pääraide',
        27562775,
        'sivuraide',
        27562776,
        undefined,
        27562774,
        '1.2.246.578.3.10002.194071',
        27562775,
        '1.2.246.578.3.10002.194072',
        27562776,
        undefined,
        27562774,
        '1.2.246.578.3.10001.188901',
        27562775,
        '1.2.246.578.3.10001.188902',
        27562776,
        undefined,
        27562774,
        null,
        27562775,
        null,
        27562776,
        'virhe1,virhe2,virhe45678901294876gb,2390483487584u39htgrln 34984utjgm03498trj34098n384993849y43890uj',
        27562774,
        new Date(2024, 12, 24),
        27562775,
        new Date(2024, 12, 24),
        27562776,
        new Date(2024, 12, 24),
        27562774,
        27562775,
        27562776,
      ],
      strings: [
        'UPDATE ams_mittaus SET geoviite_konvertoitu_long = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_lat = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rataosuus_numero = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rataosuus_nimi = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rata_kilometri = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rata_metrit= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_raide_numero = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_valimatka= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_kuvaus = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_tyyppi = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_oid = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_ratanumero_oid = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_virhe = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_updated_at = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END WHERE id = ',
        ' OR id = ',
        ' OR id = ',
        '',
      ],
    });*/
  });
});


describe('geoviite parse sql from response with flipped latlong', () => {
  test('success: basic operation', async () => {
    const sql = produceGeoviiteBatchUpdateSql(
      [
        {
          x: 259348.20489785323,
          y: 6804094.514968412,
          oldLong: 249348.20489785323,
          oldLat: 6704094.514968412,
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
          oldLong: 239348.20489785323,
          oldLat: 6604094.514968412,
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
          oldLong: 219348.20489785323,
          oldLat: 6204094.514968412,
          id: 27562776,
        },
      ],
      new Date(2024, 12, 24),
      'AMS',
      true,
    );

    expect(sql).toEqual({
      values: [
        27562774,
        259348.20489785323,
        27562775,
        245348.20489785323,
        27562776,
        undefined,
        27562774,
        6804094.514968412,
        27562775,
        6704094.514968412,
        27562776,
        undefined,
        27562774,
        249348.20489785323,
        27562775,
        239348.20489785323,
        27562776,
        219348.20489785323,
        27562774,
        6704094.514968412,
        27562775,
        6604094.514968412,
        27562776,
        6204094.514968412,
        27562774,
        '002',
        27562775,
        '001',
        27562776,
        undefined,
        27562774,
        null,
        27562775,
        null,
        27562776,
        null,
        27562774,
        270,
        27562775,
        170,
        27562776,
        undefined,
        27562774,
        300,
        27562775,
        200.123,
        27562776,
        null,
        27562774,
        null,
        27562775,
        null,
        27562776,
        null,
        27562774,
        2.0372681319713593e-10,
        27562775,
        1.0372681319713593e-10,
        27562776,
        undefined,
        27562774,
        '002',
        27562775,
        '003',
        27562776,
        undefined,
        27562774,
        'Lielahti-Kokemäki-Pori-Mäntyluoto',
        27562775,
        'Vielahti-Kokemäki-Pori-Mäntyluoto',
        27562776,
        undefined,
        27562774,
        'pääraide',
        27562775,
        'sivuraide',
        27562776,
        undefined,
        27562774,
        '1.2.246.578.3.10002.194071',
        27562775,
        '1.2.246.578.3.10002.194072',
        27562776,
        undefined,
        27562774,
        '1.2.246.578.3.10001.188901',
        27562775,
        '1.2.246.578.3.10001.188902',
        27562776,
        undefined,
        27562774,
        null,
        27562775,
        null,
        27562776,
        'virhe1,virhe2,virhe45678901294876gb,2390483487584u39htgrln 34984utjgm03498trj34098n384993849y43890uj',
        27562774,
        new Date(2024, 12, 24),
        27562775,
        new Date(2024, 12, 24),
        27562776,
        new Date(2024, 12, 24),
        27562774,
        27562775,
        27562776,
      ],
      strings: [
        'UPDATE ams_mittaus SET geoviite_konvertoitu_long = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_lat = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        " END, long = CASE when id = ",
        " then ",
        " when id = ",
        " then ",
        " when id = ",
        " then ",
        " END, lat = CASE when id = ",
        " then ",
        " when id = ",
        " then ",
        " when id = ",
        " then ",
        ' END, geoviite_konvertoitu_rataosuus_numero = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rataosuus_nimi = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rata_kilometri = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_rata_metrit= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_konvertoitu_raide_numero = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_valimatka= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide= CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_kuvaus = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_tyyppi = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_sijaintiraide_oid = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_ratanumero_oid = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_virhe = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END, geoviite_updated_at = CASE when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' when id = ',
        ' then ',
        ' END WHERE id = ',
        ' OR id = ',
        ' OR id = ',
        '',
      ],
    });
  });
});
