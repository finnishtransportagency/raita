import postgres from 'postgres';
import { log } from '../logger';
import { getSecretsManagerSecret } from './secretsManager';

// This file is (mostly) copied from backend/utils/adminLog/postgresLogger.ts
// TODO: use admin logger as local file dependency instead

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

export class PostgresLogger implements IAdminLogger {
  private source?: AdminLogSource;
  private invocationId?: string;
  private connection?: postgres.Sql;

  constructor() {}

  async init(source: AdminLogSource, invocationId: string) {
    this.source = source;
    this.invocationId = invocationId;
    return;
  }

  async info(message: string) {
    return this.logToPostgres([message], 'info');
  }
  async error(message: string) {
    return this.logToPostgres([message], 'error');
  }
  async warn(message: string) {
    return this.logToPostgres([message], 'warn');
  }
  async batch(messages: string[], level: AdminLogLevel) {
    return this.logToPostgres(messages, level);
  }

  private async getConnection() {
    if (this.connection) {
      return this.connection;
    }
    const password = await getSecretsManagerSecret('database_password');
    // other login info is read from pg env vars
    // TODO: show some error if they are not found?
    this.connection = postgres({ password });
    return this.connection;
  }

  private async logToPostgres(messages: string[], level: AdminLogLevel) {
    if (!this.source || !this.invocationId) {
      log.warn('Trying to log with PostgresLogger before initialization;');
      return;
    }
    const schema = process.env['RAITA_PGSCHEMA'];
    if (!schema) {
      throw new Error('No RAITA_PGSCHEMA');
    }
    const timestamp = new Date(Date.now()).toISOString();
    const sql = await this.getConnection();
    const rows = messages.map(message => ({
      source: this.source,
      log_timestamp: timestamp,
      invocation_id: this.invocationId,
      log_message: message,
      log_level: level,
    }));
    return await sql`
    INSERT INTO ${sql(schema)}.logging
    ${sql(rows)}`;
  }
}
