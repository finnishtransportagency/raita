import * as https from 'node:https';

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

//default vals for optional params; if we happen no need such TODO
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

// Yksittäismuunnos pelkistä koordinaateista rataosoitteeseen; muille parametrreille vakioarvot
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
  // TODO post supervision metadata how?
  const postData = JSON.stringify({
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

  const options = {
    hostname: process.env.KTV_HOSTNAME,
    path: '/ktv/api/public/KTJLisaaKuvia',
    // path: '/ktv/api/ktv/KTJLisaaKuvia',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'apiKey',
    },
  };

  const req = https.request(options, res => {
    let body = '';
    console.log('statusCode', res.statusCode);

    res.setEncoding('utf8');
    res.on('data', chunk => (body += chunk));

    res.on('end', () => {
      console.log('Successfully processed HTTPS response');
      console.log('RES body', body);
    });
  });

  req.on('error', error => {
    console.error(error);
  });

  req.write(postData);
  req.end();
}
