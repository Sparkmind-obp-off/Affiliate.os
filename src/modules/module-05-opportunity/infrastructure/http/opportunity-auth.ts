import { AppError } from '../../../../shared/errors/app-error.js'
import type { OpportunityTenantContext } from '../../application/ports.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Minimum contract auth: verify signed tenant claims; no identity ecosystem. */
export async function authenticateOpportunityRequest(
  authorization: string | undefined,
  secret: string | null,
): Promise<OpportunityTenantContext> {
  if (!secret) throw AppError.notImplemented('Persistent opportunities require AUTH_SECRET configuration')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) throw AppError.authRequired()

  const token = match[1]
  if (token.length > 8_192) throw AppError.authRequired('Invalid authentication token')
  const parts = token.split('.')
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw AppError.authRequired('Invalid authentication token')
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string]
  let header: unknown
  let payload: unknown
  let signature: Uint8Array
  try {
    header = JSON.parse(decodeBase64Url(encodedHeader))
    payload = JSON.parse(decodeBase64Url(encodedPayload))
    signature = decodeBase64UrlBytes(encodedSignature)
  } catch {
    throw AppError.authRequired('Invalid authentication token')
  }
  if (!isRecord(header) || header.alg !== 'HS256' || !isRecord(payload)) {
    throw AppError.authRequired('Invalid authentication token')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  let valid = false
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    )
  } catch {
    throw AppError.authRequired('Invalid authentication token')
  }
  if (!valid) throw AppError.authRequired('Invalid authentication token')

  const now = Math.floor(Date.now() / 1000)
  if (!Number.isSafeInteger(payload.exp) || (payload.exp as number) <= now) {
    throw AppError.authRequired('Authentication token has expired or has no valid expiry')
  }
  if (payload.nbf !== undefined && (!Number.isSafeInteger(payload.nbf) || (payload.nbf as number) > now)) {
    throw AppError.authRequired('Authentication token is not active')
  }
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.organization_id !== 'string' ||
    typeof payload.workspace_id !== 'string' ||
    !UUID_RE.test(payload.sub) ||
    !UUID_RE.test(payload.organization_id) ||
    !UUID_RE.test(payload.workspace_id)
  ) {
    throw AppError.authRequired('Authentication token is missing tenant context')
  }
  return {
    userId: payload.sub,
    organizationId: payload.organization_id,
    workspaceId: payload.workspace_id,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
