import type { NextApiHandler } from 'next';

import { apiClient } from 'shared/rest';
import * as cfg from 'shared/config';
import { prop } from 'rambda';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';

const handler: NextApiHandler = async (req, res) => {
  res.status(200).json(raw);
  // const reportTypes = apiClient
  //   .get<TypeAggs>(`/${cfg.openSearch.indexName}/_search`, {
  //     data: {
  //       size: 0,
  //       aggs: {
  //         types: {
  //           terms: {
  //             field: 'metadata.report_type.keyword',
  //             size: 10,
  //           },
  //         },
  //       },
  //     },
  //   })
  //   .then(prop('data'));

  // const fields = apiClient
  //   .get<MetadataMapping>(`/${cfg.openSearch.indexName}`)
  //   .then(
  //     d =>
  //       d.data[cfg.openSearch.indexName].mappings.properties.metadata
  //         .properties,
  //   );

  // Promise.all([reportTypes, fields])
  //   .then(xs => {
  //     const ts = xs[0];
  //   })
  //   .catch(err => {
  //     res.status(500).json({ err });
  //   });
};

export default handler;

//

/**
 * @todo Opensearch library should contain types for this,
 *       this is currently used just to get us going.
 */
type MetadataMapping = {
  [cfg.openSearch.indexName]: {
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

//

type TypeAggs<T = any> = SearchResponse<T> & {
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

const raw = {
  fields: [
    { hash: { type: 'text' } },
    { inspection_date: { type: 'date' } },
    { inspection_datetime: { type: 'date' } },
    { isEmpty: { type: 'boolean' } },
    { km_end: { type: 'long' } },
    { km_start: { type: 'long' } },
    { length: { type: 'long' } },
    { maintenance_area: { type: 'text' } },
    { maintenance_level: { type: 'text' } },
    { measurement_direction: { type: 'text' } },
    { measurement_end_location: { type: 'text' } },
    { measurement_start_location: { type: 'text' } },
    { nonparsed_inspection_datetime: { type: 'text' } },
    { report_category: { type: 'text' } },
    { report_type: { type: 'text' } },
    { source_system: { type: 'text' } },
    { system: { type: 'text' } },
    { temperature: { type: 'float' } },
    { track_id: { type: 'text' } },
    { track_number: { type: 'long' } },
    { track_part: { type: 'text' } },
    { year: { type: 'long' } },
  ],
  reportTypes: [
    { reportType: 'Tarkistuksen+Muutosraportti', count: 832 },
    { reportType: 'Virhelistaus', count: 832 },
    { reportType: 'Kilometriyhteenveto', count: 619 },
    { reportType: 'Poikkeamaraportti', count: 501 },
    { reportType: 'Käyrä', count: 412 },
    { reportType: 'Risteävät+Ajolangat', count: 168 },
    { reportType: 'Aallonmuodostusraportti', count: 166 },
    { reportType: 'Ajolangan+Geometriaraportti', count: 166 },
    { reportType: 'Ajolangan+Kulumaraportti', count: 166 },
    { reportType: 'Raidegeometriaraportti', count: 166 },
  ],
};
