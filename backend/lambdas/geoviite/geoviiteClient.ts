import * as https from 'node:https';
import { log } from '../../utils/logger';
import { RequestOptions } from 'https';
import { ClientRequest, IncomingMessage } from 'node:http';
import { pickBy  } from 'lodash';

//params that go to rest as url path params
interface trackAddressWithCoordinatePathParams{
  geometriatiedot?: boolean;
  perustiedot?: boolean;
  lisatiedot?: boolean;
}
//default vals for optional post params; if we happen to need such TODO
export const defaultTrackAddressWithCoordinatePathParams:
  trackAddressWithCoordinatePathParams ={
  geometriatiedot: true,
  lisatiedot: true,
  perustiedot: true,
};

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
//default vals for optional path params; if we happen to need such TODO
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
    x_koordinaatti_param: lat,
    y_koordinaatti_param: long,
    ...defaultTrackAddressWithCoordinatePostParams,
  };
  const result: any = await getConvertedTrackAddressesWithParams(new Array(postParams), defaultTrackAddressWithCoordinatePathParams);
  return result;
}

export interface LatLong {
  lat: number,
  long: number,
}

// Erämuunnos pelkistä koordinaateista rataosoitteeseen; muille parametreille vakioarvot
export async function getConvertedTrackAddressesWithCoords(coords: Array<LatLong>
): Promise<any> {
  const pathParamsArray = coords.map(latlong => {return{x_koordinaatti_param: latlong.lat,
    y_koordinaatti_param: latlong.long,
  ...defaultTrackAddressWithCoordinatePathParams}});

  const result: any = await getConvertedTrackAddressesWithParams(pathParamsArray, defaultTrackAddressWithCoordinatePathParams);
  return result;
}

function addPathParams(path: string, pathParams: trackAddressWithCoordinatePathParams):string {
  let resultPath = path;
  resultPath += '?';
  if(pathParams.geometriatiedot != undefined){
    resultPath += 'geometriatiedot=' + pathParams.geometriatiedot + '&';
  }
  if(pathParams.lisatiedot != undefined){
    resultPath += 'lisatiedot=' + pathParams.lisatiedot + '&';
  }
  if(pathParams.perustiedot != undefined){
    resultPath += 'perustiedot=' + pathParams.perustiedot + '&';
  }
  resultPath = resultPath.substring(0, resultPath.length-1);


  return resultPath;
}

// Erämuunnos koordinaateista rataosoitteeseen kaikilla parametreillä
async function getConvertedTrackAddressesWithParams(
  postParams: Array<trackAddressWithCoordinatePostParams>, pathParams: trackAddressWithCoordinatePathParams ,
): Promise<any> {
  return new Promise((resolve, reject) => {
    //remove params with 'undefined' value; we dont to send those to rest to mess geoviite defaults
    const cleanedPostParams = postParams.map(params => pickBy(params, v => v !== undefined))
    const postData: string = JSON.stringify(cleanedPostParams);

    // some rest params have a '-' in their name which not allowed in js object. Convert them.
    const convertedPostData = postData
      .replace('_param', '-param')
      .replace('_koordinaatti', '-koordinaatti');
    log.trace('Post data: ' + convertedPostData);

    const options: RequestOptions = {
      hostname: process.env.GEOVIITE_HOSTNAME,
      path: addPathParams('/rata-vkm/v1/rataosoitteet', pathParams),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req: ClientRequest = https.request(options, (res: IncomingMessage) => {
      let body: string = '';
      log.trace('statusCode' + res.statusCode);

      res.setEncoding('utf8');
      res.on('data', chunk => (body += chunk));

      res.on('end', () => {
        log.trace('Successfully processed HTTPS response');
        log.trace('RES body' + body);
        resolve(body);
      });
    });

    req.on('error', error => {
      log.error(error);
      reject(error.message);
    });

    req.write(postData);
    req.end();
  });
}
