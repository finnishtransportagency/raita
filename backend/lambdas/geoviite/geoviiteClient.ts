import { log } from '../../utils/logger';
import { pickBy } from 'lodash';
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';

const baseUrl = process.env.GEOVIITE_HOSTNAME; //TODO add to cloudformation config
const apiClient = axios.create({ baseURL: baseUrl });

//params that go to rest as url path params
interface trackAddressWithCoordinatePathParams {
  geometriatiedot?: boolean;
  perustiedot?: boolean;
  lisatiedot?: boolean;
}
// Default vals for optional post params; if we happen to need such TODO
//
// Params with 'undefined' values are not posted to Geoviite and Geoviite uses it's default values:
//    geometriatiedot: false,
//    lisatiedot: true,
//    perustiedot: true,
export function defaultTrackAddressWithCoordinatePathParams(): trackAddressWithCoordinatePathParams {
  return {
    geometriatiedot: undefined,
    lisatiedot: undefined,
    perustiedot: undefined,
  };
}

//params that go to rest post
export interface trackAddressWithCoordinatePostParams {
  x_koordinaatti_param: number;
  y_koordinaatti_param: number;
  koordinaatisto_param?: string;
  sade_param?: number;
  ratanumero_param?: string;
  sijaintiraide_param?: string;
  sijaintiraide_tyyppi_param?: string;
}
// Default vals for optional path params; if we happen to need such TODO
//
// Params with 'unndefined' values are not posted to Geoviite and Geoviite uses it's default values:
//    koordinaatisto: EPSG:3067
//    sade: 100
export const defaultTrackAddressWithCoordinatePostParams: Omit<
  trackAddressWithCoordinatePostParams,
  'x_koordinaatti_param' | 'y_koordinaatti_param'
> = {
  koordinaatisto_param: undefined,
  ratanumero_param: undefined,
  sade_param: undefined,
  sijaintiraide_param: undefined,
  sijaintiraide_tyyppi_param: undefined,
};

// Yksittäismuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot
export async function getConvertedTrackAddressWithCoords(
  lat: number,
  long: number,
): Promise<any> {
  const postParams: trackAddressWithCoordinatePostParams = {
    x_koordinaatti_param: long,
    y_koordinaatti_param: lat,
    ...defaultTrackAddressWithCoordinatePostParams,
  };
  const resultData: any = await getConvertedTrackAddressesWithParams(
    new Array(postParams),
    defaultTrackAddressWithCoordinatePathParams(),
  );
  return resultData;
}

export interface LatLong {
  lat: number;
  long: number;
}

// Erämuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot
export async function getConvertedTrackAddressesWithCoords(
  coords: Array<LatLong>,
): Promise<any> {
  const postParamsArray = coords.map(latlong => {
    return {
      x_koordinaatti_param: latlong.long,
      y_koordinaatti_param: latlong.lat,
      ...defaultTrackAddressWithCoordinatePostParams,
    };
  });

  const resultData: any = await getConvertedTrackAddressesWithParams(
    postParamsArray,
    defaultTrackAddressWithCoordinatePathParams(),
  );
  return resultData;
}

export async function simple(): Promise<string> {
  console.log('hello');

  const a = await apiClient
    //.get<string>('https://jsonplaceholder.typicode.com/posts')
    .get<string>('/posts')
    .then(res => res.data)
    .catch(error => {
      // Handle the error in case of failure
      log.error('at simple');
      throw error;
    });

  return a;
}

export async function simple2() {
  console.log('hello');
  const res = await apiClient.get<string>(
    'https://jsonplaceholder.typicode.com/posts',
  );
  log.info(res, 'res');
}

function addPathParams(
  path: string,
  pathParams: trackAddressWithCoordinatePathParams,
): string {
  let resultPath = path;
  resultPath += '?';
  if (pathParams.geometriatiedot != undefined) {
    resultPath += 'geometriatiedot=' + pathParams.geometriatiedot + '&';
  }
  if (pathParams.lisatiedot != undefined) {
    resultPath += 'lisatiedot=' + pathParams.lisatiedot + '&';
  }
  if (pathParams.perustiedot != undefined) {
    resultPath += 'perustiedot=' + pathParams.perustiedot + '&';
  }
  resultPath = resultPath.substring(0, resultPath.length - 1);

  return resultPath;
}

// Erämuunnos koordinaateista rataosoitteeseen kaikilla parametreillä
async function getConvertedTrackAddressesWithParams(
  postParams: Array<trackAddressWithCoordinatePostParams>,
  pathParams: trackAddressWithCoordinatePathParams,
): Promise<any> {
  //remove params with 'undefined' value; we dont to send those to rest to mess geoviite defaults
  const cleanedPostParams = postParams.map(params =>
    pickBy(params, v => v !== undefined),
  );
  const postData: string = JSON.stringify(cleanedPostParams);

  // some rest params have a '-' in their name which not allowed in js object. Convert them.
  const convertedPostData = postData
    .replace('_param', '-param')
    .replace('_koordinaatti', '-koordinaatti');
  log.trace('Post data: ' + convertedPostData);

  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    } as RawAxiosRequestHeaders,
  };

  const path = addPathParams('/rata-vkm/v1/rataosoitteet', pathParams);
  log.trace('path: ' + path);
  const responseData: AxiosResponse<any> | void = await apiClient
    .post(path)
    .then(response => {
      log.trace(response.data, 'response:');
      return response.data;
    })
    .catch(error => {
      // Handle the error in case of failure
      log.error(error, 'at getConvertedTrackAddressesWithParams');
      throw error;
    });
  return responseData;
}
