/**
 * These API routes are only used for local development.
 * Since this application is built through `next export`, we will not
 * be able to use anything within `pages/api/`.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import { client } from 'shared/rest';

/**
 * @todo Opensearch library should contain types for this,
 *       this is currently used just to get us going.
 */
type MetadataMapping = {
  'metadata-index': {
    mappings: {
      properties: {
        metadata: {
          properties: {
            [x: string]: any;
          };
        };
      };
    };
  };
};

/**
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return client
    .get<MetadataMapping>('/metadata-index')
    .then(d =>
      res
        .status(200)
        .json(d.data['metadata-index'].mappings.properties.metadata.properties),
    )
    .catch(err => res.status(500).json({ err }));
}
