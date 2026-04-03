import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const sslEnabled =
      this.configService.get<string>('DB_SSL_ENABLED', 'true') === 'true';
    const rejectUnauthorized =
      this.configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED', 'false') ===
      'true';
    const ca = this.readSslValue('DB_SSL_CA') ?? undefined;
    const cert = this.readSslValue('DB_SSL_CERT') ?? undefined;
    const key = this.readSslValue('DB_SSL_KEY') ?? undefined;
    const servername = this.readSslValue('DB_SSL_SERVERNAME') ?? undefined;
    const ssl = sslEnabled
      ? {
          rejectUnauthorized,
          ca,
          cert,
          key,
          servername,
        }
      : undefined;

    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DB_PORT', '5432')),
      user: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME', 'landing_softdev'),
      ssl,
      connectionTimeoutMillis: Number(
        this.configService.get<string>('DB_CONNECTION_TIMEOUT_MS', '3000'),
      ),
      max: 10,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('DB_HOST') &&
      this.configService.get<string>('DB_NAME') &&
      this.configService.get<string>('DB_USERNAME'),
    );
  }

  async healthcheck(): Promise<boolean> {
    await this.query('SELECT 1');
    return true;
  }

  async query<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
  ): Promise<T[]> {
    const executor = client ?? this.pool;
    const result: QueryResult<T> = await executor.query(text, params);
    return result.rows;
  }

  async one<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
  ): Promise<T | null> {
    const rows = await this.query<T>(text, params, client);
    return rows[0] ?? null;
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private readSslValue(key: string): string | null {
    const raw = this.configService.get<string>(key);

    if (!raw) {
      return null;
    }

    if (existsSync(raw)) {
      return readFileSync(raw, 'utf8');
    }

    return raw.replace(/\\n/g, '\n');
  }
}
