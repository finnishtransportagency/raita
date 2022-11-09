import { SearchResponse } from '@opensearch-project/opensearch/api/types';
import { NextApiHandler } from 'next';
import * as R from 'rambda';

import { client } from 'shared/rest';
import { IDocument } from 'shared/types';

import * as cfg from 'shared/config';

const handler: NextApiHandler = (req, res) => {
  client
    .get<SearchResponse<IDocument>>(`/${cfg.openSearch.indexName}/_search`, {
      data: req.body,
    })
    .then(r => ({ result: { body: r.data } }))
    .then(R.tap(console.log))
    .then(r => res.status(200).json(r))
    .catch(err => {
      console.log({ err });
      res.status(500).json({ err });
    });
};

export default handler;
