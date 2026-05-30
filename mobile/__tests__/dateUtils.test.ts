import { extractTime, extractDateTime, extractDate } from '../src/utils/dateUtils';

describe('extractTime', () => {
  it('extracts time from ISO string with timezone', () => {
    expect(extractTime('2026-05-29T14:30:00+00:00')).toBe('14:30');
  });

  it('extracts time from ISO string with Z', () => {
    expect(extractTime('2026-05-29T08:15:00Z')).toBe('08:15');
  });

  it('extracts time from ISO string without timezone', () => {
    expect(extractTime('2026-05-29T22:45:00')).toBe('22:45');
  });
});

describe('extractDateTime', () => {
  it('formats as DD/MM/YYYY HH:mm', () => {
    expect(extractDateTime('2026-05-29T14:30:00Z')).toBe('29/05/2026 14:30');
  });

  it('handles timezone offset', () => {
    expect(extractDateTime('2026-01-15T09:00:00+03:00')).toBe('15/01/2026 09:00');
  });
});

describe('extractDate', () => {
  it('formats as DD/MM/YYYY', () => {
    expect(extractDate('2026-05-29T14:30:00Z')).toBe('29/05/2026');
  });

  it('handles date-only string', () => {
    expect(extractDate('2026-12-25')).toBe('25/12/2026');
  });
});
