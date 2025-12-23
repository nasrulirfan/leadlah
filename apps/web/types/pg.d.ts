declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
  }

  export interface QueryResult<R = any> {
    rows: R[];
    rowCount: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    end(): Promise<void>;
    connect(): Promise<PoolClient>;
    query<R = any>(text: string, values?: any[]): Promise<QueryResult<R>>;
  }

  export interface PoolClient {
    release(err?: Error): void;
    query<R = any>(text: string, values?: any[]): Promise<QueryResult<R>>;
  }
}
