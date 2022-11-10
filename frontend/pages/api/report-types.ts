import type { NextApiRequest, NextApiResponse } from 'next';
import { prop } from 'rambda';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';

import * as cfg from 'shared/config';
import { client } from 'shared/rest';

export type TypeAggs<T = any> = SearchResponse<T> & {
  aggregations: {
    types: {
      doc_count_error_upper_bound: number;
      sum_other_doc_count: number;
      buckets: {
        key: string;
        doc_count: number;
      }[];
    };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  client
    .get<TypeAggs>(`/${cfg.openSearch.indexName}/_search`, {
      data: {
        size: 0,
        aggs: {
          types: {
            terms: {
              field: 'metadata.report_type.keyword',
              size: 10,
            },
          },
        },
      },
    })
    .then(prop('data'))
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => res.status(500).json({ err }));
}
