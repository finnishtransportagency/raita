export type AdminLogSource =
  | 'delete-process'
  | 'data-inspection'
  | 'data-reception';

export interface IAdminLogger {
  init: (source: AdminLogSource, invocationId: string) => Promise<any>;
  info: (message: string) => Promise<any>;
  warn: (message: string) => Promise<any>;
  error: (message: string) => Promise<any>;
}
