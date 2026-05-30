import { isApiError, getApiErrorMessage, isHttpStatus } from '../src/utils/errors';

describe('isApiError', () => {
  it('returns true for axios-like error', () => {
    const err = { response: { status: 400, data: { detail: 'Bad request' } } };
    expect(isApiError(err)).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isApiError(new Error('fail'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApiError(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isApiError('error')).toBe(false);
  });
});

describe('getApiErrorMessage', () => {
  it('extracts detail from API error', () => {
    const err = { response: { status: 422, data: { detail: 'Campo inválido' } } };
    expect(getApiErrorMessage(err)).toBe('Campo inválido');
  });

  it('returns fallback for non-API error', () => {
    expect(getApiErrorMessage(new Error('fail'), 'Fallback')).toBe('Fallback');
  });

  it('returns default fallback when no message provided', () => {
    expect(getApiErrorMessage('random')).toBe('Ocorreu um erro. Tente novamente.');
  });
});

describe('isHttpStatus', () => {
  it('matches correct status', () => {
    const err = { response: { status: 409 } };
    expect(isHttpStatus(err, 409)).toBe(true);
  });

  it('does not match different status', () => {
    const err = { response: { status: 404 } };
    expect(isHttpStatus(err, 409)).toBe(false);
  });

  it('returns false for non-API error', () => {
    expect(isHttpStatus(new Error('fail'), 500)).toBe(false);
  });
});
