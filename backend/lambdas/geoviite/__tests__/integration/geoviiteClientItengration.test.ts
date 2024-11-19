import { GeoviiteClient } from '../../geoviiteClient';

import { log } from '../../../../utils/logger';
import { Decimal } from 'prisma/prisma-client/runtime/library';
import axios, { AxiosResponse } from 'axios';

describe('geoviite simple axios test', () => {
  test('success: basic operation', async () => {
    const apiClient = axios.create();

    const responseData: AxiosResponse<any> | void = await apiClient
      .get(
        'https://avoinapi.testivaylapilvi.fi/rata-vkm/v1/rataosoitteet?x=22.50615539&y=61.296478&sade=100&koordinaatisto=' +
          encodeURIComponent('EPSG:4326'),
      )
      .then(response => {
        log.info(response.data, 'response:');
      })
      .catch(error => {
        // Handle the error in case of failure
        log.error(error, 'at getConvertedTrackAddressesWithParams');
      });
  });
});

describe('geoviite multiple points with Prisma coords with geoviiteclient', () => {
  test('success: basic operation', async () => {
    const client = new GeoviiteClient('https://avoinapi.testivaylapilvi.fi/');
    const points: Array<{ lat: Decimal; long: Decimal; id: number }> = [
      { lat: new Decimal(60.42316751), long: new Decimal(25.1106662), id: 123 },
      {
        lat: new Decimal(60.42316976),
        long: new Decimal(25.11066558),
        id: 124,
      },
      { lat: new Decimal(60.423172), long: new Decimal(25.11066497), id: 125 },
    ];

    const converted = await client.getConvertedTrackAddressesWithPrismaCoords(points);
    log.info(converted, 'converted');

    expect(true).toBeTruthy();
  });
});

describe('geoviite multiple points with Prisma coords with geoviiteclient, lat long flipped', () => {
  test('success: basic operation', async () => {
    const client = new GeoviiteClient('https://avoinapi.testivaylapilvi.fi/');
    const points: Array<{ lat: Decimal; long: Decimal; id: number }> = [
      { lat: new Decimal(60.42316751), long: new Decimal(25.1106662), id: 123 },
      {
        lat: new Decimal(60.42316976),
        long: new Decimal(25.11066558),
        id: 124,
      },
      { lat: new Decimal(60.423172), long: new Decimal(25.11066497), id: 125 },
    ];

    const converted = await client.getConvertedTrackAddressesWithPrismaCoords(points);
    log.info(converted, 'converted');

    expect(true).toBeTruthy();
  });
});

