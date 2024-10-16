import { log } from '../../utils/logger';
import { pickBy } from 'lodash';
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';
import { Decimal } from 'prisma/prisma-client/runtime/library';

const baseUrl = process.env.GEOVIITE_HOSTNAME; //TODO add to cloudformation config
const apiClient = axios.create({ baseURL: baseUrl });


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
type getConvertedTrackAddressesWithCoordsResultType = {

}


//params that go to rest as url path params
type trackAddressWithCoordinatePathParams = {
  geometriatiedot?: boolean;
  perustiedot?: boolean;
  lisatiedot?: boolean;
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
  };

//params that go to rest post
type trackAddressWithCoordinatePostParams = {
  x_koordinaatti_param: string;
  y_koordinaatti_param: string;
  koordinaatisto_param?: string;
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
  'x_koordinaatti_param' | 'y_koordinaatti_param'
> = {
  koordinaatisto_param: undefined,
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
    x_koordinaatti_param: long.toString(),
    y_koordinaatti_param: lat.toString(),
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
      x_koordinaatti_param: latlong.long.toString(),
      y_koordinaatti_param: latlong.lat.toString(),
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

// Erämuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot defaultTrackAddressWithCoordinate*Params -vakioista ellei vastaava extra*Params parametrinä.
export async function getConvertedTrackAddressesWithPrismaCoords(
  coords: Array<{ lat: Decimal | null; long: Decimal | null }>,
  extraPathParams?: trackAddressWithCoordinatePathParams,
  extraPostParams?: Omit<
    trackAddressWithCoordinatePostParams,
    'x_koordinaatti_param' | 'y_koordinaatti_param'
  >,
): Promise<any> {
  const postParamsArray = coords.map(latlong => {
    return {
      x_koordinaatti_param: latlong.long ? latlong.long.toString() : '',
      y_koordinaatti_param: latlong.lat ? latlong.lat.toString() : '',
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
    .post(path, config)
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
