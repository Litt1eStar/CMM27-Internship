export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Codes raised by the SQL functions/triggers as "<CODE>: message".
const DOMAIN_CODES = {
  NOT_FOUND: 404,
  NOT_A_STUDENT: 403,
  INVALID_ACTION: 400,
  PREREQ_NOT_MET: 422,
  INVALID_TRANSITION: 409,
  ALREADY_DONE: 409,
  FORWARD_ONLY: 409,
  IMMUTABLE_LOG: 409,
};

/** Converts a Supabase/PostgREST error into an HttpError. */
export function fromDbError(error) {
  const message = error?.message ?? 'Database error';
  const match = /^([A-Z_]+):\s*(.*)$/s.exec(message);
  if (match && DOMAIN_CODES[match[1]]) {
    return new HttpError(DOMAIN_CODES[match[1]], match[1], match[2]);
  }
  switch (error?.code) {
    case '23505':
      return new HttpError(409, 'DUPLICATE', 'A record with this value already exists', error.details);
    case '23503':
      return new HttpError(409, 'IN_USE', 'This record is referenced by other data', error.details);
    case '23514':
      return new HttpError(422, 'CONSTRAINT_VIOLATION', message);
    case '22P02':
      return new HttpError(400, 'INVALID_INPUT', message);
    default:
      return new HttpError(500, 'DB_ERROR', message);
  }
}

/** Throws if a Supabase response has an error, otherwise returns data. */
export function unwrap({ data, error }) {
  if (error) throw fromDbError(error);
  return data;
}

/** Validates input with a zod schema or throws a 400. */
export function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
  }
  return result.data;
}

/** Wraps async route handlers so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorMiddleware(err, req, res, _next) {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      code: err instanceof HttpError ? err.code : 'INTERNAL_ERROR',
      message: status >= 500 && !(err instanceof HttpError) ? 'Internal server error' : err.message,
      details: err.details,
    },
  });
}
