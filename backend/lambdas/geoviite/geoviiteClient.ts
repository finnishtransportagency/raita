import { log } from '../../utils/logger';
import { pickBy } from 'lodash';
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';
import { Decimal } from 'prisma/prisma-client/runtime/library';

//const baseUrl = process.env.GEOVIITE_HOSTNAME; //TODO uncomment
const baseUrl = 'https://avoinapi.testivaylapilvi.fi/';

//TODO
//const apiClient = axios.create({ baseURL: baseUrl });
const apiClient = axios.create();

/*{
  "type": "FeatureCollection",
  "features": [
  {
    "geometry": {
      "type": "Point",
      "coordinates": []
    },
    "properties": {
      "x": 259348.20489785323,
      "y": 6804094.514968412,
      "valimatka": 2.0372681319713593E-10,
      "ratanumero": "002",
      "sijaintiraide": "002",
      "sijaintiraide_kuvaus": "Lielahti-Kokemäki-Pori-Mäntyluoto",
      "sijaintiraide_tyyppi": "pääraide",
      "ratakilometri": 270,
      "ratametri": 300,
      "ratametri_desimaalit": 0
    },
    "type": "Feature"
  }
]
}*/

enum ResponseType {
  FEATURE_COLLECTION = 'FeatureCollection',
}
enum GeometryType {
  POINT = 'Point',
}
enum FeatureType {
  FEATURE = 'Feature',
}

export type GetConvertedTrackAddressesWithCoordsResultType = {
  type: ResponseType;
  features: Feature[];
};

type Feature = {
  geometry: Geometry;
  properties: Properties;
  type: FeatureType;
};

type Geometry = {
  type: GeometryType;
  coordinates: Array<any>;
};

type Properties = {
  x: number;
  y: number;
  valimatka: number;
  ratanumero: string;
  sijaintiraide: string;
  sijaintiraide_kuvaus: string;
  sijaintiraide_tyyppi: string;
  ratakilometri: number;
  ratametri: number;
  ratametri_desimaalit: number;
};

//params that go to rest as url path params
type trackAddressWithCoordinatePathParams = {
  geometriatiedot?: boolean;
  perustiedot?: boolean;
  lisatiedot?: boolean;
  koordinaatisto?: string;
};
// Default vals for optional post params; if we happen to need such TODO
//
// Params with 'undefined' values are not posted to Geoviite and Geoviite uses it's default values:
//    geometriatiedot: false,
//    lisatiedot: true,
//    perustiedot: true,
export const defaultTrackAddressWithCoordinatePathParams: trackAddressWithCoordinatePathParams =
  {
    geometriatiedot: undefined,
    lisatiedot: undefined,
    perustiedot: undefined,
    koordinaatisto: encodeURIComponent('EPSG:4258'),
  };

//params that go to rest post
type trackAddressWithCoordinatePostParams = {
  x: number | undefined;
  y: number | undefined;
  sade_param?: number;
  ratanumero_param?: string;
  sijaintiraide_param?: string;
  sijaintiraide_tyyppi_param?: string;
};

// Default vals for optional path params; if we happen to need such TODO
//
// Params with 'undefined' values are not posted to Geoviite and Geoviite uses it's default values:
//    koordinaatisto: EPSG:3067
//    sade: 100
const defaultTrackAddressWithCoordinatePostParams: Omit<
  trackAddressWithCoordinatePostParams,
  'x' | 'y'
> = {
  ratanumero_param: undefined,
  sade_param: undefined,
  sijaintiraide_param: undefined,
  sijaintiraide_tyyppi_param: undefined,
};

// Yksittäismuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot defaultTrackAddressWithCoordinate*Params -vakioista ellei vastaava extra*Params parametrinä.
export async function getConvertedTrackAddressWithCoords(
  lat: number,
  long: number,
  extraPathParams?: trackAddressWithCoordinatePathParams,
  extraPostParams?: Omit<
    trackAddressWithCoordinatePostParams,
    'x_koordinaatti_param' | 'y_koordinaatti_param'
  >,
): Promise<any> {
  const postParams: trackAddressWithCoordinatePostParams = {
    x: long,
    y: lat,
    ...(extraPostParams
      ? extraPostParams
      : defaultTrackAddressWithCoordinatePostParams),
  };
  const resultData: any = await getConvertedTrackAddressesWithParams(
    new Array(postParams),
    extraPathParams
      ? extraPathParams
      : defaultTrackAddressWithCoordinatePathParams,
  );
  return resultData;
}

// Erämuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot defaultTrackAddressWithCoordinate*Params -vakioista ellei vastaava extra*Params parametrinä.
export async function getConvertedTrackAddressesWithCoords(
  coords: Array<{ lat: number; long: number }>,
  extraPathParams?: trackAddressWithCoordinatePathParams,
  extraPostParams?: Omit<
    trackAddressWithCoordinatePostParams,
    'x_koordinaatti_param' | 'y_koordinaatti_param'
  >,
): Promise<any> {
  const postParamsArray = coords.map(latlong => {
    return {
      x: latlong.long,
      y: latlong.lat,
      ...(extraPostParams
        ? extraPostParams
        : defaultTrackAddressWithCoordinatePostParams),
    };
  });

  const resultData: any = await getConvertedTrackAddressesWithParams(
    postParamsArray,
    extraPathParams
      ? extraPathParams
      : defaultTrackAddressWithCoordinatePathParams,
  );
  return resultData;
}

function convertResultToRaitaStyle(
  resultData: GetConvertedTrackAddressesWithCoordsResultType,
  ids: Array<{
    id: number;
  }>,
) {
  console.log(resultData);
  console.log(ids);
  //resultData.features.entries()[0].perustiedot.
}

// Erämuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot defaultTrackAddressWithCoordinate*Params -vakioista ellei vastaava extra*Params parametrinä.
export async function getConvertedTrackAddressesWithPrismaCoords(
  coords: Array<{ lat: Decimal | null; long: Decimal | null; id: number }>,
  extraPathParams?: trackAddressWithCoordinatePathParams,
  extraPostParams?: Omit<
    trackAddressWithCoordinatePostParams,
    'x_koordinaatti_param' | 'y_koordinaatti_param'
  >,
): Promise<any> {
  const postParamsArray = coords.map(latlong => {
    return {
      x: latlong.long?.toNumber(),
      y: latlong.lat?.toNumber(),
      ...(extraPostParams
        ? extraPostParams
        : defaultTrackAddressWithCoordinatePostParams),
    };
  });

  const resultData: GetConvertedTrackAddressesWithCoordsResultType =
    await getConvertedTrackAddressesWithParams(
      postParamsArray,
      extraPathParams
        ? extraPathParams
        : defaultTrackAddressWithCoordinatePathParams,
    );

  const convertedResult = convertResultToRaitaStyle(resultData, coords);

  return convertedResult;
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
  if (pathParams.koordinaatisto != undefined) {
    resultPath += 'koordinaatisto=' + pathParams.koordinaatisto + '&';
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
  log.info(cleanedPostParams,"cleanedPostParams");
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

  const path = addPathParams('https://avoinapi.testivaylapilvi.fi/rata-vkm/v1/rataosoitteet/rata-vkm/v1/rataosoitteet', pathParams);
  log.info('path: ' + path);
  log.info(postParams);
  log.info(pathParams);
  log.info(convertedPostData);

  const responseData: AxiosResponse<any> | void = await apiClient
    .post(path, cleanedPostParams, config)
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
