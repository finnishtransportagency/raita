import { SearchResponse } from '@opensearch-project/opensearch/api/types';

export namespace Common {
  export type Input = {
    label?: string;
  };
}

export namespace App {
  export type Locales = 'en' | 'fi';
}

export namespace Rest {
  export type Field = {
    type: 'text' | 'long' | 'date' | 'float';
    fields: {
      [x: string]: any;
    };
  };

  export type Fields = Record<string, Field>;

  export type Reports = SearchResponse<IDocument>;
}

//

/**
 * Something along the lines the way OpenSearch results are represented
 */
export interface ISearchResult<T> {
  _index: string;
  _id: string;
  _score: number;
  _source: T;
}

export interface IDocument {
  fileName: string;
  arn: string;
  bucket: string;
  metadata: IDocumentMetadata;
}

export interface IDocumentMetadata {}
