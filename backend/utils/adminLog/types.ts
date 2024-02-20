export type AdminLogSource =
  | 'delete-process'
  | 'data-inspection'
  | 'data-reception';

export type AdminLogLevel = 'info' | 'warn' | 'error';

export interface IAdminLogger {
  init: (source: AdminLogSource, invocationId: string) => Promise<any>;
  info: (message: string) => Promise<any>;
  warn: (message: string) => Promise<any>;
  error: (message: string) => Promise<any>;
  batch: (messages: string[], level: AdminLogLevel) => Promise<any>;
}

export type RawLogRow = {
  source: AdminLogSource;
  log_timestamp: string;
  invocation_id: string;
  log_message: string;
  log_level: AdminLogLevel;
};

export type SingleEventLogsResponse = {
  totalSize: number;
  pageIndex: number;
  pageSize: number;
  logs: RawLogRow[];
};

export type SummaryDBResponse = {
  log_date: string;
  start_timestamp: string;
  invocation_id: string;
  log_level: AdminLogLevel;
  source: AdminLogSource;
  count: string;
};

export type SummaryRow = {
  log_date: string;
  invocation_id: string;
  start_timestamp: string;
  counts: {
    [source: string]: {
      error: number;
      warn: number;
      info: number;
    };
  };
};

export type StatsQueryDBResponseRow = {
  log_level: string;
  event_count: string;
};

export type AdminLogSummary = {
  totalSize: number;
  pageIndex: number;
  pageSize: number;
  stats: StatsQueryDBResponseRow[]; // row count for each log level
  summaryRows: SummaryRow[]; // list of "events" with message counts for each level and source
};
