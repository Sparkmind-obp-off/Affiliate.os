import { Pool } from 'pg'
import { PostgresOpportunityRepository } from './postgres-opportunity-repository.js'

const pools = new Map<string, Pool>()

/** Runtime composition for PostgreSQL. Credentials remain in Worker secrets. */
export function createPostgresOpportunityRepository(
  databaseUrl: string,
  databaseSsl: boolean,
): PostgresOpportunityRepository {
  const key = `${databaseSsl ? 'ssl:' : 'plain:'}${databaseUrl}`
  let pool = pools.get(key)
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    })
    pools.set(key, pool)
  }
  return new PostgresOpportunityRepository(pool)
}
