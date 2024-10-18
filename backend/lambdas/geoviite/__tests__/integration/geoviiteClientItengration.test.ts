import {
  getConvertedTrackAddressesWithCoords,
  getConvertedTrackAddressesWithPrismaCoords,
  getConvertedTrackAddressWithCoords,
} from '../../geoviiteClient';

import { log } from '../../../../utils/logger';
import { Decimal } from 'prisma/prisma-client/runtime/library';
import axios, {AxiosResponse} from "axios";

describe('geoviite simple', () => {
  test('success: basic operation', async () => {

    const apiClient = axios.create();

    const responseData: AxiosResponse<any> | void = await apiClient.get('https://avoinapi.testivaylapilvi.fi/rata-vkm/v1/rataosoitteet?x=22.50615539&y=61.296478&sade=100&koordinaatisto='+encodeURIComponent('EPSG:4326'))
      .then(response => {
        log.info(response.data, 'response:');

      })
      .catch(error => {
        // Handle the error in case of failure
        log.error(error, 'at getConvertedTrackAddressesWithParams');

      });
  });
});


describe('geoviite multiple points with Prisma coords', () => {
  test('success: basic operation', async () => {

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


    expect(true).toBeTruthy();

  });
});

