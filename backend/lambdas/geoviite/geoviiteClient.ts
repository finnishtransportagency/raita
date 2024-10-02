import * as https from 'node:https';
import { log } from '../../utils/logger';
import {RequestOptions} from "https";
import {ClientRequest, IncomingMessage} from "node:http";

export interface trackAddressWithCoordinateParams {
  x_koordinaatti_param: number;
  y_koordinaatti_param: number;
  koordinaatisto_param?: string;
  sade_param?: number;
  ratanumero_param?: string;
  sijaintiraide_param?: string;
  sijaintiraide_tyyppi_param?: string;
  geometriatiedot?: boolean;
  perustiedot?: boolean;
  lisatiedot?: boolean;
}

//default vals for optional params; if we happen to need such TODO
export const defaultTrackAddressWithCoordinateParams: Omit<
  trackAddressWithCoordinateParams,
  'x_koordinaatti_param' | 'y_koordinaatti_param'
> = {
  geometriatiedot: true,
  koordinaatisto_param: undefined,
  lisatiedot: true,
  perustiedot: true,
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
  const params: trackAddressWithCoordinateParams = {
    x_koordinaatti_param: lat,
    y_koordinaatti_param: long,
    ...defaultTrackAddressWithCoordinateParams,
  };
  return getConvertedTrackAddressWithParams(params);
}

// Yksittäismuunnos koordinaatista rataosoitteeseen kaikilla parametreillä
async function getConvertedTrackAddressWithParams(
  params: trackAddressWithCoordinateParams,
): Promise<any> {
  const postData: string = JSON.stringify({
    data: [
      {
        x_koordinaatti_param: params.x_koordinaatti_param,
        y_koordinaatti_param: params.y_koordinaatti_param,

        ...(params.koordinaatisto_param && {
          koordinaatisto_param: params.koordinaatisto_param,
        }),
        ...(params.sade_param && { sade_param: params.sade_param }),
        ...(params.ratanumero_param && {
          ratanumero_param: params.ratanumero_param,
        }),
        ...(params.sijaintiraide_param && {
          sijaintiraide_param: params.sijaintiraide_param,
        }),
        ...(params.sijaintiraide_tyyppi_param && {
          sijaintiraide_tyyppi_param: params.sijaintiraide_tyyppi_param,
        }),
        ...(params.geometriatiedot && {
          geometriatiedot: params.geometriatiedot,
        }),
        ...(params.perustiedot && { perustiedot: params.perustiedot }),
        ...(params.lisatiedot && { lisatiedot: params.lisatiedot }),
      },
    ],
  });

  // some rest params have a '-' in their name which not allowed in js object. Convert them.
  const convertedPostData = postData
    .replace('_param', '-param')
    .replace('_koordinaatti', '-koordinaatti');
  log.trace('Post data: ' + convertedPostData);

  const options:RequestOptions = {
    hostname: process.env.GEOVIITE_HOSTNAME,
    path: '/rata-vkm/v1/rataosoitteet',
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
    });
  });

  req.on('error', error => {
    log.error(error);
  });

  req.write(postData);
  req.end();
}
