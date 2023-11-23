import postgres from 'postgres';
import { log } from './logger';
import { AdminLogSource, IAdminLogger } from './adminLogger';
import { getEnvOrFail } from '../../utils';
import { getSecretsManagerSecret } from './secretsManager';

export class PostgresLogger implements IAdminLogger {
  private source: AdminLogSource;
  private invocationId: string;
  private connection: postgres.Sql;

  constructor() {}

  async init(source: AdminLogSource, invocationId: string) {
    this.source = source;
    this.invocationId = invocationId;
    return;
  }

  async info(message: string) {
    return this.logToPostgres(message, 'info');
  }
  async error(message: string) {
    return this.logToPostgres(message, 'error');
  }
  async warn(message: string) {
    return this.logToPostgres(message, 'warn');
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

  private async logToPostgres(
    message: string,
    level: 'info' | 'warn' | 'error',
  ) {
    if (!this.source || !this.invocationId) {
      log.warn('Trying to log with PostgresLogger before initialization;');
      return;
    }
    const schema = getEnvOrFail('RAITA_PGSCHEMA');
    const timestamp = new Date(Date.now()).toISOString();
    const sql = await this.getConnection();
    return await sql`
    INSERT INTO ${sql(schema)}.logging
    (source, log_timestamp, invocation_id, log_message, log_level)
    VALUES (${this.source}, ${timestamp}, ${
      this.invocationId
    }, ${message}, ${level})`;
  }
}
