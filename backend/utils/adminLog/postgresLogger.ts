import { log } from '../logger';
import { AdminLogLevel, AdminLogSource, IAdminLogger } from './types';
import {
  DBConnection,
  getDBConnection,
} from '../../lambdas/dataProcess/csvCommon/db/dbUtil';

export class PostgresLogger implements IAdminLogger {
  private source: AdminLogSource;
  private invocationId: string;
  private connection: Promise<DBConnection>;

  constructor(dbConnection: Promise<DBConnection>) {
    if (dbConnection) {
      this.connection = dbConnection;
    }
  }

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
    // other login info is read from pg env vars
    // TODO: show some error if they are not found?
    this.connection = getDBConnection();
    return this.connection;
  }

  private async logToPostgres(messages: string[], level: AdminLogLevel) {
    if (!this.source || !this.invocationId) {
      log.warn('Trying to log with PostgresLogger before initialization;');
      return;
    }
    const connection = await this.getConnection();
    const { prisma, schema } = connection;
    const timestamp = new Date(Date.now()).toISOString();
    const rows = messages.map(message => ({
      source: this.source,
      log_timestamp: timestamp,
      invocation_id: this.invocationId,
      log_message: message,
      log_level: level,
    }));
    return await prisma.logging.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }
}
