import {
  GeoviiteClient
} from '../geoviiteClient';

import { log } from '../../../utils/logger';
import { Decimal } from 'prisma/prisma-client/runtime/library';
import {jest} from "@jest/globals";

const client = new GeoviiteClient('https://avoinapi.testivaylapilvi.fi/');

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
console.log(loggings);
    expect(loggings.includes('path: rata-vkm/v1/rataosoitteet?koordinaatisto=EPSG%3A4258')).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x":25.7482,"y":61.9241}]',
      ),
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
console.log(loggings);
    log.info(loggings);
    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?geometriatiedot=true&koordinaatisto=EPSG:3067',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x":257482,"y":619241,"sade":120}]',
      ),
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
console.log(loggings);
    log.info(loggings);
    expect(
      loggings.includes(
        'path: rata-vkm/v1/rataosoitteet?geometriatiedot=true&lisatiedot=false',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x":25.7482,"y":61.9241}]',
      ),
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
      const converted = await client.getConvertedTrackAddressesWithCoords(points);
      log.info(converted, 'converted');
    } catch (error) {
      //testing our api request format; response error ignored
    }
    const loggings = logSpy.mock.calls.map(call => call.toString());
console.log(loggings);
    expect(loggings.includes('path: rata-vkm/v1/rataosoitteet?koordinaatisto=EPSG%3A4258')).toBeTruthy();
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
console.log(loggings);

    expect(loggings.includes('path: rata-vkm/v1/rataosoitteet?koordinaatisto=EPSG%3A4258')).toBeTruthy();
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
console.log(loggings);
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
