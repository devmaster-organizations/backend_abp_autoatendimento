export interface DatabaseQueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface Database {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<DatabaseQueryResult<T>>;
  isConnected(): boolean;
}