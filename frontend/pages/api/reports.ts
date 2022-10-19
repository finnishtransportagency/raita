/**
 * These API routes are only used for local development.
 * Since this application is built through `next export`, we will not
 * be able to use anything within `pages/api/`.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';

import * as cfg from 'shared/config';

import { client } from 'shared/rest';
import { IDocument } from 'shared/types';

//

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  const data = client
    .get<SearchResponse<IDocument>>(`/${cfg.openSearch.indexName}/_search`, {
      data: req.body,
    })
    .then(r => {
      res.status(200).json(r.data);
    })
    .catch(err => {
      console.log({ err });
      res.status(500).json({ err });
    });
}

//

type IndexNames = 'metadata-index';

type Indices = Record<IndexNames, object>;

export type ApiRequest<K extends string | number | symbol> = {
  [P in K]: {
    mappings: {
      properties: {};
    };
  };
};
