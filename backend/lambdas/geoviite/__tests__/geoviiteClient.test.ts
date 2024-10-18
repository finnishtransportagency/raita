import {
  getConvertedTrackAddressesWithCoords,
  getConvertedTrackAddressesWithPrismaCoords,
  getConvertedTrackAddressWithCoords,
} from '../geoviiteClient';

import { log } from '../../../utils/logger';
import { Decimal } from 'prisma/prisma-client/runtime/library';

describe('geoviite single point with default params', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');
    try {
      const converted = await getConvertedTrackAddressWithCoords(
        61.9241,
        25.7482,
      );
    } catch (error) {
      //testing our api request format; response error ignored
    }

    const loggings = logSpy.mock.calls.map(call => call.toString());
    expect(loggings.includes('path: /rata-vkm/v1/rataosoitteet')).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":"25.7482","y_koordinaatti_param":"61.9241","koordinaatisto_param":"EPSG:4258"}]',
      ),
    ).toBeTruthy();
  });
});

describe('geoviite single point with a custom path param and extra post params', () => {
  test('success: basic operation', async () => {
    const extraPathParams = {
      geometriatiedot: true,
    };

    const extraPostParams = {
      koordinaatisto_param: 'testCoordSystem',
      ratanumero_param: undefined,
      sade_param: 120,
      sijaintiraide_param: undefined,
      sijaintiraide_tyyppi_param: undefined,
    };

    const logSpy = jest.spyOn(log, 'trace');
    try {
      const converted = await getConvertedTrackAddressWithCoords(
        61.9241,
        25.7482,
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
        'path: /rata-vkm/v1/rataosoitteet?geometriatiedot=true',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":"25.7482","y_koordinaatti_param":"61.9241","koordinaatisto_param":"testCoordSystem","sade_param":120}]',
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
      const converted = await getConvertedTrackAddressWithCoords(
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
        'path: /rata-vkm/v1/rataosoitteet?geometriatiedot=true&lisatiedot=false',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":"25.7482","y_koordinaatti_param":"61.9241","koordinaatisto_param":"EPSG:4258"}]',
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
      const converted = await getConvertedTrackAddressesWithCoords(points);
      log.info(converted, 'converted');
    } catch (error) {
      //testing our api request format; response error ignored
    }
    const loggings = logSpy.mock.calls.map(call => call.toString());
    expect(loggings.includes('path: /rata-vkm/v1/rataosoitteet')).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":"25.7482","y_koordinaatti_param":"61.9241","koordinaatisto_param":"EPSG:4258"},{"x_koordinaatti_param":"24.7182","y_koordinaatti_param":"61.5641","koordinaatisto_param":"EPSG:4258"},{"x_koordinaatti_param":"25.1482","y_koordinaatti_param":"61.1231","koordinaatisto_param":"EPSG:4258"}]',
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
        await getConvertedTrackAddressesWithPrismaCoords(points);
      log.info(converted, 'converted');
    } catch (error) {
      //testing our api request format; response error ignored
    }
    const loggings = logSpy.mock.calls.map(call => call.toString());

    expect(loggings.includes('path: /rata-vkm/v1/rataosoitteet')).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":"25.7482","y_koordinaatti_param":"61.9241","koordinaatisto_param":"EPSG:4258"},{"x_koordinaatti_param":"24.7182","y_koordinaatti_param":"61.5641","koordinaatisto_param":"EPSG:4258"},{"x_koordinaatti_param":"25.1482","y_koordinaatti_param":"61.1231","koordinaatisto_param":"EPSG:4258"}]',
      ),
    ).toBeTruthy();
  });
});

describe('geoviite multiple points with extra params', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');

    const extraPathParams = {
      geometriatiedot: true,
      lisatiedot: false,
      perustiedot: undefined,
    };

    const extraPostParams = {
      koordinaatisto_param: 'testCoordSystem',
      ratanumero_param: undefined,
      sade_param: 120,
      sijaintiraide_param: undefined,
      sijaintiraide_tyyppi_param: undefined,
    };

    const points: Array<{ lat: number; long: number }> = [
      { lat: 61.9241, long: 25.7482 },
      { lat: 61.5641, long: 24.7182 },
      { lat: 61.1231, long: 25.1482 },
    ];

    try {
      const converted = await getConvertedTrackAddressesWithCoords(
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
        'path: /rata-vkm/v1/rataosoitteet?geometriatiedot=true&lisatiedot=false',
      ),
    ).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":"25.7482","y_koordinaatti_param":"61.9241","koordinaatisto_param":"testCoordSystem","sade_param":120},{"x_koordinaatti_param":"24.7182","y_koordinaatti_param":"61.5641","koordinaatisto_param":"testCoordSystem","sade_param":120},{"x_koordinaatti_param":"25.1482","y_koordinaatti_param":"61.1231","koordinaatisto_param":"testCoordSystem","sade_param":120}]',
      ),
    ).toBeTruthy();
  });
});
