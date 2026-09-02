import {
  ERROR_CODES,
  ERROR_HTTP_STATUS,
  ERROR_RETRYABLE,
  type ErrorCode,
} from './error-codes.js'

export type ErrorDetails = Record<string, unknown>

/**
 * AppError is the ONLY error type allowed to cross the HTTP boundary
 * with a caller-visible message.
 *
 * Anything else is normalized to INTERNAL_ERROR with a generic message,
 * so internal details / stack traces never leak (Task 01 §18).
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly httpStatus: number
  public readonly retryable: boolean
  public readonly details: ErrorDetails | undefined
  public override readonly cause: unknown

  constructor(
    code: ErrorCode,
    message: string,
    options: { details?: ErrorDetails; cause?: unknown; httpStatus?: number } = {},
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.httpStatus = options.httpStatus ?? ERROR_HTTP_STATUS[code]
    this.retryable = ERROR_RETRYABLE[code]
    this.details = options.details
    this.cause = options.cause
  }

  static authRequired(message = 'Authentication is required'): AppError {
    return new AppError(ERROR_CODES.AUTH_REQUIRED, message)
  }

  static forbidden(message = 'Operation is not permitted'): AppError {
    return new AppError(ERROR_CODES.FORBIDDEN, message)
  }

  static tenantAccessDenied(message = 'Tenant access denied'): AppError {
    return new AppError(ERROR_CODES.TENANT_ACCESS_DENIED, message)
  }

  static validation(message = 'Request validation failed', details?: ErrorDetails): AppError {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, message, details ? { details } : {})
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, message)
  }

  static conflict(message = 'Resource conflict'): AppError {
    return new AppError(ERROR_CODES.CONFLICT, message)
  }

  static notImplemented(message = 'Capability is not implemented yet'): AppError {
    return new AppError(ERROR_CODES.NOT_IMPLEMENTED, message)
  }

  static internal(message = 'Internal server error', cause?: unknown): AppError {
    return new AppError(ERROR_CODES.INTERNAL_ERROR, message, { cause })
  }

  /** Normalize any thrown value into an AppError without leaking internals. */
  static from(error: unknown): AppError {
    if (error instanceof AppError) return error
    return AppError.internal('Internal server error', error)
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}
