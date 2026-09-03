import { Pool } from 'pg'
import { PostgresContentGenerationRepository } from './postgres-content-generation-repository.js'

const pools = new Map<string, Pool>()
export function createPostgresContentGenerationRepository(
  databaseUrl: string,
  ssl: boolean,
): PostgresContentGenerationRepository {
  const key = `${databaseUrl}|${ssl}`
  let pool = pools.get(key)
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, ssl: ssl ? { rejectUnauthorized: true } : undefined, max: 3 })
    pools.set(key, pool)
  }
  return new PostgresContentGenerationRepository(pool)
}
