import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromDbError, HttpError } from '../src/lib/errors.js';

const cases = [
  [{ message: 'PREREQ_NOT_MET: both Resume and Portfolio must be complete' }, 422, 'PREREQ_NOT_MET', 'both Resume and Portfolio must be complete'],
  [{ message: 'COMPANY_REQUIRED: choose a company' }, 422, 'COMPANY_REQUIRED'],
  [{ message: 'INVALID_TRANSITION: submit first' }, 409, 'INVALID_TRANSITION'],
  [{ message: 'ALREADY_DONE: done' }, 409, 'ALREADY_DONE'],
  [{ message: 'FORWARD_ONLY: no going back' }, 409, 'FORWARD_ONLY'],
  [{ message: 'COMPANY_NOT_FOUND: missing' }, 404, 'COMPANY_NOT_FOUND'],
  [{ message: 'IMMUTABLE_LOG: nope' }, 409, 'IMMUTABLE_LOG'],
  [{ message: 'dup', code: '23505' }, 409, 'DUPLICATE'],
  [{ message: 'fk', code: '23503' }, 409, 'IN_USE'],
  [{ message: 'check', code: '23514' }, 422, 'CONSTRAINT_VIOLATION'],
  [{ message: 'bad uuid', code: '22P02' }, 400, 'INVALID_INPUT'],
  [{ message: 'boom', code: 'XX000' }, 500, 'DB_ERROR'],
  // An unknown "PREFIX:" must not be treated as a domain code.
  [{ message: 'SOMETHING_ELSE: x', code: '23514' }, 422, 'CONSTRAINT_VIOLATION'],
];

for (const [input, status, code, message] of cases) {
  test(`${input.code ?? ''} ${input.message} -> ${status} ${code}`, () => {
    const err = fromDbError(input);
    assert.ok(err instanceof HttpError);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    if (message) assert.equal(err.message, message);
  });
}
