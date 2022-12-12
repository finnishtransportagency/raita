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

/**
 * DEV ENV DUMMY
 */
const raw = {
  fields: [
    {
      campaign: {
        type: 'text',
      },
    },
    {
      file_type: {
        type: 'text',
      },
    },
    {
      inspection_date: {
        type: 'date',
      },
    },
    {
      inspection_datetime: {
        type: 'date',
      },
    },
    {
      isEmpty: {
        type: 'boolean',
      },
    },
    {
      km_end: {
        type: 'long',
      },
    },
    {
      km_start: {
        type: 'long',
      },
    },
    {
      length: {
        type: 'long',
      },
    },
    {
      maintenance_area: {
        type: 'text',
      },
    },
    {
      maintenance_level: {
        type: 'text',
      },
    },
    {
      measurement_direction: {
        type: 'text',
      },
    },
    {
      measurement_end_location: {
        type: 'text',
      },
    },
    {
      measurement_start_location: {
        type: 'text',
      },
    },
    {
      nonparsed_inspection_date: {
        type: 'text',
      },
    },
    {
      nonparsed_inspection_datetime: {
        type: 'text',
      },
    },
    {
      report_category: {
        type: 'text',
      },
    },
    {
      report_type: {
        type: 'text',
      },
    },
    {
      source_system: {
        type: 'text',
      },
    },
    {
      system: {
        type: 'text',
      },
    },
    {
      temperature: {
        type: 'float',
      },
    },
    {
      track_id: {
        type: 'text',
      },
    },
    {
      track_number: {
        type: 'long',
      },
    },
    {
      track_part: {
        type: 'text',
      },
    },
    {
      year: {
        type: 'long',
      },
    },
    {
      zip_name: {
        type: 'text',
      },
    },
    {
      zip_reception__date: {
        type: 'text',
      },
    },
    {
      zip_reception__year: {
        type: 'text',
      },
    },
  ],
  reportTypes: [
    {
      reportType: 'Tarkistuksen Muutosraportti',
      count: 5903,
    },
    {
      reportType: 'Virhelistaus',
      count: 5608,
    },
    {
      reportType: 'Poikkeamaraportti',
      count: 3312,
    },
    {
      reportType: 'Kilometriyhteenveto',
      count: 2893,
    },
    {
      reportType: 'Käyrä',
      count: 1931,
    },
    {
      reportType: 'Vaihdegeometriaraportti',
      count: 1269,
    },
    {
      reportType: 'Raidegeometriaraportti',
      count: 1204,
    },
    {
      reportType: 'Ulottumaraportti',
      count: 638,
    },
    {
      reportType: 'Ratajohtoraportti',
      count: 627,
    },
    {
      reportType: 'Ajolangan Kulumaraportti',
      count: 543,
    },
  ],
  fileTypes: [
    {
      fileType: 'pdf',
      count: 14286,
    },
    {
      fileType: 'txt',
      count: 12060,
    },
    {
      fileType: 'csv',
      count: 1804,
    },
    {
      fileType: 'xlsx',
      count: 206,
    },
  ],
  systems: [
    {
      value: 'TG',
      count: 8297,
    },
    {
      value: 'AMS',
      count: 4365,
    },
    {
      value: 'OHL',
      count: 3570,
    },
    {
      value: 'CW',
      count: 2367,
    },
    {
      value: 'RP',
      count: 1933,
    },
    {
      value: 'TSIGHT',
      count: 1894,
    },
    {
      value: 'LSI-TSI',
      count: 1878,
    },
    {
      value: 'THIS',
      count: 1799,
    },
    {
      value: 'RC',
      count: 1300,
    },
    {
      value: 'VCUBE',
      count: 980,
    },
  ],
  trackNumbers: [],
  trackParts: [
    {
      value: 'RMARP',
      count: 1775,
    },
    {
      value: 'HKIRP',
      count: 1510,
    },
    {
      value: 'KVRP',
      count: 906,
    },
    {
      value: 'RIRP',
      count: 738,
    },
    {
      value: 'LHRP',
      count: 708,
    },
    {
      value: 'LARP',
      count: 628,
    },
    {
      value: 'TPERP',
      count: 559,
    },
    {
      value: 'KKIRMA',
      count: 552,
    },
    {
      value: 'SKRP',
      count: 535,
    },
    {
      value: 'KKNTKU',
      count: 508,
    },
  ],
};
