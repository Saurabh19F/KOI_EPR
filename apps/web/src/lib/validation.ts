import { ZodSchema, ZodError } from 'zod';
import toast from 'react-hot-toast';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

export function validateForm<T>(
  schema: ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.') || 'general';
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }
      return { success: false, errors };
    }
    return { success: false, errors: { general: ['Validation failed'] } };
  }
}

export function validateAndToast<T>(
  schema: ZodSchema<T>,
  data: unknown,
  successMessage?: string,
): ValidationResult<T> {
  const result = validateForm(schema, data);

  if (result.success) {
    if (successMessage) {
      toast.success(successMessage);
    }
  } else {
    // Show first error as toast
    const firstError = Object.values(result.errors || {})[0];
    if (firstError && firstError.length > 0) {
      toast.error(firstError[0]);
    }
  }

  return result;
}

export function getFieldError<T>(
  errors: Record<string, string[]> | undefined,
  fieldPath: string,
): string | undefined {
  if (!errors) return undefined;
  const fieldErrors = errors[fieldPath];
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
}

export function hasFieldError<T>(
  errors: Record<string, string[]> | undefined,
  fieldPath: string,
): boolean {
  return !!getFieldError(errors, fieldPath);
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (India)
export function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// GST Number validation (India)
export function isValidGST(gstNumber: string): boolean {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
}

// PAN Number validation (India)
export function isValidPAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

// Positive number validation
export function isPositiveNumber(value: unknown): boolean {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return !isNaN(num) && num > 0;
}

// Non-negative number validation
export function isNonNegativeNumber(value: unknown): boolean {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return !isNaN(num) && num >= 0;
}

// File size validation
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Date validation
export function isValidDate(date: unknown): boolean {
  return date instanceof Date ? !isNaN(date.getTime()) : false;
}

// String trim utility
export function trimStrings<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = value.trim();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = trimStrings(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// UUID validation
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
