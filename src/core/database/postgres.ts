import { Pool, type QueryResultRow } from 'pg';
import type { Database, DatabaseQueryResult } from './protocols';
import { getDatabaseUrl } from './settings';

export class Postgres implements Database {
  private static instance: Postgres | null = null;

  private readonly pool: Pool;
  private connected = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    this.pool = new Pool({
      connectionString: getDatabaseUrl(),
    });

    this.pool.on('error', (error) => {
      this.connected = false;
      console.error('Unexpected Postgres error', error);
    });
  }

  static getInstance() {
    if (!Postgres.instance) {
      Postgres.instance = new Postgres();
    }

    return Postgres.instance;
  }

  async connect() {
    if (this.connected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      const client = await this.pool.connect();

      try {
        await client.query('SELECT 1');
        this.connected = true;
        console.log('Postgres connected');
      } finally {
        client.release();
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  async disconnect() {
    if (!this.connected && !this.connectionPromise) {
      return;
    }

    await this.pool.end();
    this.connected = false;
    console.log('Postgres disconnected');
  }

  async query<T = QueryResultRow>(sql: string, params: readonly unknown[] = []): Promise<DatabaseQueryResult<T>> {
    if (!this.connected) {
      await this.connect();
    }

    const result = await this.pool.query(sql, [...params]);

    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? 0,
    };
  }

  isConnected() {
    return this.connected;
  }
}

export const postgres = Postgres.getInstance();