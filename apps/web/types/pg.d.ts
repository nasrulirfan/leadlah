declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
  }

  export class Pool {
    constructor(config?: PoolConfig);
    end(): Promise<void>;
    connect(): Promise<PoolClient>;
  }

  export interface PoolClient {
    release(err?: Error): void;
  }
}
