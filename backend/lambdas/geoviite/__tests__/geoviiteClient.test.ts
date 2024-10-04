import {
  defaultTrackAddressWithCoordinatePathParams,
  getConvertedTrackAddressesWithCoords,
  getConvertedTrackAddressWithCoords,
  LatLong,
  simple,
} from '../geoviiteClient';

import { log } from '../../../utils/logger';

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
        'Post data: [{"x-koordinaatti-param":25.7482,"y_koordinaatti_param":61.9241}]',
      ),
    ).toBeTruthy();
  });
});




describe('geoviite single point with custom params', () => {
  test('success: basic operation', async () => {

    jest.mock('../geoviiteClient', () => {
      return {
        ...jest.requireActual('../geoviiteClient'),
        defaultTrackAddressWithCoordinatePathParams: jest.fn(),
      }
    });

    (defaultTrackAddressWithCoordinatePathParams as jest.Mock).mockReturnValue({
      geometriatiedot: true,
      lisatiedot: false,
      perustiedot: undefined,
    });


    console.log(defaultTrackAddressWithCoordinatePathParams());

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
    console.log(loggings);
    expect(loggings.includes('path: /rata-vkm/v1/rataosoitteet')).toBeTruthy();
    expect(
      loggings.includes(
        'Post data: [{"x-koordinaatti-param":25.7482,"y_koordinaatti_param":61.9241}]',
      ),
    ).toBeTruthy();
  });
});

describe('geoviite multiple points with default params', () => {
  test('success: basic operation', async () => {
    const logSpy = jest.spyOn(log, 'trace');
    const points: Array<LatLong> = [
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
        'Post data: [{"x-koordinaatti-param":25.7482,"y_koordinaatti_param":61.9241},{"x_koordinaatti_param":24.7182,"y_koordinaatti_param":61.5641},{"x_koordinaatti_param":25.1482,"y_koordinaatti_param":61.1231}]',
      ),
    ).toBeTruthy();
  });
});

test('console.log the text "hello"', async () => {
  try {
    const b = await simple();
    console.log(b);
  } catch (error) {
    console.log('ERROR');
  }
});
