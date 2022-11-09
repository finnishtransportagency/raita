import { SearchResponse } from '@opensearch-project/opensearch/api/types';
import { NextApiHandler } from 'next';
import { client } from 'shared/rest';
import { IDocument } from 'shared/types';

import * as cfg from 'shared/config';

const handler: NextApiHandler = (req, res) => {
  client
    .get<SearchResponse<IDocument>>(`/${cfg.openSearch.indexName}/_search`, {
      data: req.body,
    })
    .then(r => {
      console.log({ r });
      return r;
    })
    .then(r => res.status(200).json(r.data))
    .catch(err => {
      console.log({ err });
      res.status(500).json({ err });
    });
};

export default handler;
