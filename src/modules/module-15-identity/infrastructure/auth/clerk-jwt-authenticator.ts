import { AppError } from '../../../../shared/errors/app-error.js'
import type { ExternalIdentityAuthenticator } from '../../application/ports.js'
import type { AuthenticatedIdentity } from '../../domain/models.js'

type JwtHeader = { alg?: unknown; kid?: unknown; typ?: unknown }
type JwtClaims = { sub?: unknown; iss?: unknown; exp?: unknown; nbf?: unknown; azp?: unknown }
type JsonWebKeySet = { keys?: JsonWebKey[] }

const MAX_TOKEN_LENGTH = 16_384
const CLOCK_SKEW_SECONDS = 60
const jwksCache = new Map<string, { expiresAt: number; keys: JsonWebKey[] }>()

export interface ClerkJwtAuthenticatorOptions {
  issuer: string
  jwksUrl: string
  authorizedParty?: string | null
  fetcher?: typeof fetch
  now?: () => number
}

export class ClerkJwtAuthenticator implements ExternalIdentityAuthenticator {
  private readonly issuer: string
  private readonly jwksUrl: string
  private readonly authorizedParty: string | null
  private readonly fetcher: typeof fetch
  private readonly now: () => number

  constructor(options: ClerkJwtAuthenticatorOptions) {
    this.issuer = options.issuer.replace(/\/$/, '')
    this.jwksUrl = options.jwksUrl
    this.authorizedParty = options.authorizedParty ?? null
    this.fetcher = options.fetcher ?? fetch
    this.now = options.now ?? (() => Date.now())
  }

  async authenticate(authorization: string | undefined): Promise<AuthenticatedIdentity> {
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i)
    if (!match?.[1] || match[1].length > MAX_TOKEN_LENGTH) throw AppError.authRequired()
    const token = match[1]
    const parts = token.split('.')
    if (parts.length !== 3 || parts.some((part) => !part)) throw AppError.authRequired('Invalid authentication token')

    let header: JwtHeader
    let claims: JwtClaims
    let signature: Uint8Array
    try {
      header = JSON.parse(decodeBase64Url(parts[0]!)) as JwtHeader
      claims = JSON.parse(decodeBase64Url(parts[1]!)) as JwtClaims
      signature = decodeBase64UrlBytes(parts[2]!)
    } catch {
      throw AppError.authRequired('Invalid authentication token')
    }

    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || typeof claims.sub !== 'string') {
      throw AppError.authRequired('Invalid authentication token')
    }

    const nowSeconds = Math.floor(this.now() / 1000)
    if (
      claims.iss !== this.issuer ||
      !Number.isSafeInteger(claims.exp) ||
      (claims.exp as number) <= nowSeconds - CLOCK_SKEW_SECONDS ||
      (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || (claims.nbf as number) > nowSeconds + CLOCK_SKEW_SECONDS)) ||
      (this.authorizedParty !== null && claims.azp !== this.authorizedParty)
    ) {
      throw AppError.authRequired('Authentication token is not valid for this application')
    }

    const jwk = (await this.loadJwks()).find((key) => (key as JsonWebKey & { kid?: string }).kid === header.kid && key.kty === 'RSA')
    if (!jwk) throw AppError.authRequired('Authentication token key is not recognized')

    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      )
      const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        signature,
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
      )
      if (!valid) throw AppError.authRequired('Invalid authentication token')
    } catch (error) {
      if (error instanceof AppError) throw error
      throw AppError.authRequired('Invalid authentication token')
    }

    return { provider: 'clerk', subject: claims.sub }
  }

  private async loadJwks(): Promise<JsonWebKey[]> {
    const cached = jwksCache.get(this.jwksUrl)
    if (cached && cached.expiresAt > this.now()) return cached.keys

    let response: Response
    try {
      response = await this.fetcher(this.jwksUrl, { headers: { accept: 'application/json' } })
    } catch {
      throw AppError.authRequired('Authentication service is unavailable')
    }
    if (!response.ok) throw AppError.authRequired('Authentication service is unavailable')

    let payload: JsonWebKeySet
    try {
      payload = (await response.json()) as JsonWebKeySet
    } catch {
      throw AppError.authRequired('Authentication service is unavailable')
    }
    const keys = Array.isArray(payload.keys) ? payload.keys : []
    if (keys.length === 0) throw AppError.authRequired('Authentication service is unavailable')
    jwksCache.set(this.jwksUrl, { keys, expiresAt: this.now() + 5 * 60_000 })
    return keys
  }
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(decodeBase64UrlBytes(value))
}

function decodeBase64UrlBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}
