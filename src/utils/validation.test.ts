import { describe, it, expect } from 'vitest';
import { validateWhat3Words, validateCoordinates, validateOSGrid } from './validation';

describe('validateWhat3Words', () => {
  it('should validate correct what3words format', () => {
    expect(validateWhat3Words('word.word.word')).toBe(true);
    expect(validateWhat3Words('filled.count.soap')).toBe(true);
    expect(validateWhat3Words('abc.def.ghi')).toBe(true);
  });

  it('should reject invalid what3words format', () => {
    expect(validateWhat3Words('word.word')).toBe(false);
    expect(validateWhat3Words('word.word.word.word')).toBe(false);
    expect(validateWhat3Words('word-word-word')).toBe(false);
    expect(validateWhat3Words('word.word.123')).toBe(false);
    expect(validateWhat3Words('')).toBe(false);
    expect(validateWhat3Words('...')).toBe(false);
  });
});

describe('validateCoordinates', () => {
  it('should validate valid coordinates', () => {
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(51.5074, -0.1278)).toBe(true);
    expect(validateCoordinates(-90, -180)).toBe(true);
    expect(validateCoordinates(90, 180)).toBe(true);
  });

  it('should reject invalid latitude', () => {
    expect(validateCoordinates(91, 0)).toBe(false);
    expect(validateCoordinates(-91, 0)).toBe(false);
  });

  it('should reject invalid longitude', () => {
    expect(validateCoordinates(0, 181)).toBe(false);
    expect(validateCoordinates(0, -181)).toBe(false);
  });

  it('should reject NaN values', () => {
    expect(validateCoordinates(NaN, 0)).toBe(false);
    expect(validateCoordinates(0, NaN)).toBe(false);
  });
});

describe('validateOSGrid', () => {
  it('should validate correct OS Grid references', () => {
    expect(validateOSGrid('TQ123456')).toBe(true);
    expect(validateOSGrid('SU 123 456')).toBe(true);
    expect(validateOSGrid('NT123456')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(validateOSGrid('tq123456')).toBe(true);
    expect(validateOSGrid('TQ123456')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(validateOSGrid('T123456')).toBe(false);
    expect(validateOSGrid('TQ12345')).toBe(false);
    expect(validateOSGrid('TQ1234567')).toBe(false);
    expect(validateOSGrid('123456')).toBe(false);
    expect(validateOSGrid('')).toBe(false);
  });
});
