/**
 * @deprecated
 */
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

export enum FieldType {
  TEXT = 'text',
  LONG = 'long',
  FLOAT = 'float',
  DATE = 'date',
  BOOLEAN = 'boolean',
}

export type GenericField<T> = { type: T };

export type Field = GenericField<FieldType>;

export namespace Rest {
  export type FieldType = 'text' | 'long' | 'date' | 'float';

  export type Field = {
    type: FieldType;
    fields: {
      [x: string]: any;
    };
  };

  export type Fields = Record<string, Field>;

  export type Reports = SearchResponse;
}

export type ImageKeys = {
  fileKey: string;
  imageKeys: string[];
};
//

/**
 * Something along the lines the way OpenSearch results are represented
 * @deprecated Use OpenSearch-provided types instead
 * @see {@link SearchHit}
 * @see {@link SearchResponse}
 */
export interface ISearchResult<T> {
  score: number;
  source: T;
}

//

export interface IDocument {
  score?: number;
  source: {
    key: string;
    file_name: string;
    size: number;
    metadata: IDocumentMetadata;
  };
}

export interface IDocumentMetadata {}

export interface SearchResponse {
  total: number;
  keys: Array<string>;
  totalSize: number;
  hits: Array<IDocument>;
}

export interface ImageKeyResponse {
  images: {
    key: string;
    size: number;
  }[];
}

export interface AdminLogsResponse {
  logs: {
    source: string;
    invocation_id: string;
    log_timestamp: string;
    log_message: string;
    log_level: string;
  }[];
}

export interface PollingProgress {
  progressData: {
    status: ProgressStatus;
    progressPercentage: number;
    url?: string | undefined;
  };
}

export enum ProgressStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export enum BannerType {
  INFO = 'INFO',
  WARNING = 'WARNING',
}
