import { Pool } from 'pg'
import { PostgresDemandSignalRepository } from './postgres-demand-repository.js'

const pools = new Map<string, Pool>()
export function createPostgresDemandSignalRepository(databaseUrl: string, databaseSsl: boolean): PostgresDemandSignalRepository {
  const key = `${databaseSsl ? 'ssl:' : 'plain:'}${databaseUrl}`
  let pool = pools.get(key)
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, ssl: databaseSsl ? { rejectUnauthorized: true } : undefined, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 })
    pools.set(key, pool)
  }
  return new PostgresDemandSignalRepository(pool)
}
