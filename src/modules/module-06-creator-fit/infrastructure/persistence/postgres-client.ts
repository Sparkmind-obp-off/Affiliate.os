import { Pool } from 'pg'
import { PostgresCreatorRepository } from './postgres-creator-repository.js'

const pools = new Map<string, Pool>()

export function createPostgresCreatorRepository(
  databaseUrl: string,
  databaseSsl: boolean,
): PostgresCreatorRepository {
  const key = `${databaseSsl ? 'ssl:' : 'plain:'}${databaseUrl}`
  let pool = pools.get(key)
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseSsl ? { rejectUnauthorized: true } : undefined,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    })
    pools.set(key, pool)
  }
  return new PostgresCreatorRepository(pool)
}
