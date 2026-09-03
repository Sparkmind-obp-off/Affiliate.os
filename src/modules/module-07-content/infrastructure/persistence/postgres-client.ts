import { Pool } from 'pg'
import { PostgresContentOpportunityRepository } from './postgres-content-opportunity-repository.js'

const pools = new Map<string, Pool>()
export function createPostgresContentOpportunityRepository(
  databaseUrl: string,
  ssl: boolean,
): PostgresContentOpportunityRepository {
  const key = `${databaseUrl}|${ssl}`
  let pool = pools.get(key)
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, ssl: ssl ? { rejectUnauthorized: true } : undefined, max: 3 })
    pools.set(key, pool)
  }
  return new PostgresContentOpportunityRepository(pool)
}
