import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidIndianPhone,
  isValidGST,
  isValidPAN,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
  isValidUUID,
  formatFileSize,
  trimStrings,
  getFieldError,
  hasFieldError,
} from './validation';

describe('isValidEmail', () => {
  it('should accept valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('admin@erp.local')).toBe(true);
    expect(isValidEmail('a.b@c.d.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @domain.com')).toBe(false);
  });
});

describe('isValidIndianPhone', () => {
  it('should accept valid Indian phone numbers', () => {
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('+919876543210')).toBe(true);
    expect(isValidIndianPhone('+91 9876543210')).toBe(true);
    expect(isValidIndianPhone('6123456789')).toBe(true);
    expect(isValidIndianPhone('7000000000')).toBe(true);
    expect(isValidIndianPhone('8999999999')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidIndianPhone('')).toBe(false);
    expect(isValidIndianPhone('1234567890')).toBe(false);
    expect(isValidIndianPhone('5555555555')).toBe(false);
    expect(isValidIndianPhone('98765')).toBe(false);
  });
});

describe('isValidGST', () => {
  it('should accept valid GST numbers', () => {
    expect(isValidGST('27AAPFU0939F1ZV')).toBe(true);
    expect(isValidGST('07AAACH7409R1ZZ')).toBe(true);
  });

  it('should reject invalid GST numbers', () => {
    expect(isValidGST('')).toBe(false);
    expect(isValidGST('INVALIDGST')).toBe(false);
    expect(isValidGST('27AAPFU09391ZV')).toBe(false);
  });
});

describe('isValidPAN', () => {
  it('should accept valid PAN numbers', () => {
    expect(isValidPAN('ABCDE1234F')).toBe(true);
    expect(isValidPAN('ZZZZZ9999Z')).toBe(true);
  });

  it('should reject invalid PAN numbers', () => {
    expect(isValidPAN('')).toBe(false);
    expect(isValidPAN('12345')).toBe(false);
    expect(isValidPAN('ABCDE123F')).toBe(false);
    expect(isValidPAN('1BCDE1234F')).toBe(false);
  });
});

describe('isPositiveNumber', () => {
  it('should accept positive numbers', () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.001)).toBe(true);
    expect(isPositiveNumber('42')).toBe(true);
  });

  it('should reject non-positive values', () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber('abc')).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });
});

describe('isNonNegativeNumber', () => {
  it('should accept zero and positive numbers', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(1)).toBe(true);
    expect(isNonNegativeNumber('0')).toBe(true);
  });

  it('should reject negative values', () => {
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber('-5')).toBe(false);
  });
});

describe('isValidDate', () => {
  it('should accept valid dates', () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date('2024-01-01'))).toBe(true);
  });

  it('should reject invalid dates', () => {
    expect(isValidDate(new Date('invalid'))).toBe(false);
    expect(isValidDate('2024-01-01')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });
});

describe('isValidUUID', () => {
  it('should accept valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should format with decimals', () => {
    expect(formatFileSize(1500)).toBe('1.46 KB');
  });
});

describe('trimStrings', () => {
  it('should trim string values', () => {
    const result = trimStrings({ name: '  hello  ', age: 25 });
    expect(result.name).toBe('hello');
    expect(result.age).toBe(25);
  });

  it('should trim nested objects', () => {
    const result = trimStrings({
      address: { city: '  Mumbai  ', pin: '400001' },
    });
    expect((result.address as any).city).toBe('Mumbai');
  });

  it('should preserve arrays', () => {
    const result = trimStrings({ tags: ['a', 'b'] } as any);
    expect(result.tags).toEqual(['a', 'b']);
  });
});

describe('getFieldError / hasFieldError', () => {
  const errors = {
    email: ['Email is required', 'Invalid email'],
    name: ['Name is required'],
  };

  it('should return first error for field', () => {
    expect(getFieldError(errors, 'email')).toBe('Email is required');
    expect(getFieldError(errors, 'name')).toBe('Name is required');
  });

  it('should return undefined for non-existent field', () => {
    expect(getFieldError(errors, 'phone')).toBeUndefined();
    expect(getFieldError(undefined, 'email')).toBeUndefined();
  });

  it('should check if field has errors', () => {
    expect(hasFieldError(errors, 'email')).toBe(true);
    expect(hasFieldError(errors, 'phone')).toBe(false);
    expect(hasFieldError(undefined, 'email')).toBe(false);
  });
});
