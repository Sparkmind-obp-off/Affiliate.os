/**
 * Canonical, machine-readable error codes.
 *
 * Contract source: DOC 22 — API & INTEGRATION CONTRACT, §223 ERROR CONTRACT.
 * Codes MUST be STABLE, MACHINE-READABLE and DOCUMENTED.
 * Adding a code is allowed; renaming/removing one is a breaking contract change.
 */
export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_AUTH_EXPIRED: 'EXTERNAL_AUTH_EXPIRED',
  TIMEOUT: 'TIMEOUT',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/** HTTP status mapping for each canonical error code. */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  AUTH_REQUIRED: 401,
  FORBIDDEN: 403,
  TENANT_ACCESS_DENIED: 403,
  VALIDATION_ERROR: 422,
  RESOURCE_NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  EXTERNAL_API_ERROR: 502,
  EXTERNAL_AUTH_EXPIRED: 401,
  TIMEOUT: 504,
  NOT_IMPLEMENTED: 501,
  INTERNAL_ERROR: 500,
}

/**
 * Whether a client may safely retry the same operation.
 * Retryable errors are transient by nature.
 */
export const ERROR_RETRYABLE: Record<ErrorCode, boolean> = {
  AUTH_REQUIRED: false,
  FORBIDDEN: false,
  TENANT_ACCESS_DENIED: false,
  VALIDATION_ERROR: false,
  RESOURCE_NOT_FOUND: false,
  CONFLICT: false,
  RATE_LIMITED: true,
  EXTERNAL_API_ERROR: true,
  EXTERNAL_AUTH_EXPIRED: false,
  TIMEOUT: true,
  NOT_IMPLEMENTED: false,
  INTERNAL_ERROR: false,
}
