import { SearchResponse } from '@opensearch-project/opensearch/api/types';

export namespace Common {
  export type Input = {
    label?: string;
  };

  export type SelectItem<T = string> = {
    key: string;
    value: T;
  };

  export type SelectItems<T = string> = SelectItem<T>[];
}

export type Range<T> = {
  start?: T;
  end?: T;
};

export namespace App {
  export type Locales = 'en' | 'fi';
}

export namespace Rest {
  export type FieldType = 'text' | 'long' | 'date' | 'float';

  export type Field = {
    type: FieldType;
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
 * @deprecated Use OpenSearch-provided types instead
 * @see {@link SearchHit}
 * @see {@link SearchResponse}
 */
export interface ISearchResult<T> {
  _index: string;
  _id: string;
  _score: number;
  _source: T;
}

//

export interface IDocument {
  key: string;
  file_name: string;
  bucket_arn: string;
  bucket_name: string;
  size: number;
  metadata: IDocumentMetadata;
}

export interface IDocumentMetadata {}
