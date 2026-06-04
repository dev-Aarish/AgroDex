import { describe, it, expect } from 'vitest';
import { normalizeDate } from '../src/lib/api';

describe('normalizeDate', () => {
  // DD-MM-YYYY format tests
  it('should convert DD-MM-YYYY to YYYY-MM-DD', () => {
    expect(normalizeDate('28-10-2025')).toBe('2025-10-28');
  });

  it('should convert 01-01-2024 to 2024-01-01', () => {
    expect(normalizeDate('01-01-2024')).toBe('2024-01-01');
  });

  it('should convert 31-12-2023 to 2023-12-31', () => {
    expect(normalizeDate('31-12-2023')).toBe('2023-12-31');
  });

  // YYYY-MM-DD format tests
  it('should return YYYY-MM-DD unchanged (2025-10-28)', () => {
    expect(normalizeDate('2025-10-28')).toBe('2025-10-28');
  });

  it('should return YYYY-MM-DD unchanged (2024-01-01)', () => {
    expect(normalizeDate('2024-01-01')).toBe('2024-01-01');
  });

  it('should return YYYY-MM-DD unchanged (2023-12-31)', () => {
    expect(normalizeDate('2023-12-31')).toBe('2023-12-31');
  });

  // Invalid format tests
  it('should throw error for slash format (28/10/2025)', () => {
    expect(() => normalizeDate('28/10/2025')).toThrow('Invalid date format');
  });

  it('should throw error for dot format (2025.10.28)', () => {
    expect(() => normalizeDate('2025.10.28')).toThrow('Invalid date format');
  });

  it('should throw error for US format (10-28-2025)', () => {
    expect(() => normalizeDate('10-28-2025')).toThrow('Invalid date format');
  });

  it('should throw error for invalid string', () => {
    expect(() => normalizeDate('invalid')).toThrow('Invalid date format');
  });

  it('should throw error for empty string', () => {
    expect(() => normalizeDate('')).toThrow('Invalid date format');
  });

  it('should include expected formats in error message', () => {
    expect(() => normalizeDate('28/10/2025')).toThrow('Expected DD-MM-YYYY or YYYY-MM-DD');
  });

  // Edge cases
  it('should handle leap year date (29-02-2024)', () => {
    expect(normalizeDate('29-02-2024')).toBe('2024-02-29');
  });

  it('should handle leap year date in ISO format (2024-02-29)', () => {
    expect(normalizeDate('2024-02-29')).toBe('2024-02-29');
  });

  it('should handle single digit dates with leading zeros (01-05-2025)', () => {
    expect(normalizeDate('01-05-2025')).toBe('2025-05-01');
  });

  it('should handle single digit dates with leading zeros (09-09-2025)', () => {
    expect(normalizeDate('09-09-2025')).toBe('2025-09-09');
  });
});