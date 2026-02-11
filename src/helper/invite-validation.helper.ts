import { InviteImportError } from '../domain/type/invite.types';
import { UserRole } from '../domain/enum/enum';

const VALID_EMAIL_DOMAIN = '@skysolution.com';

// ===== HELPER: Safe string conversion =====
export function toSafeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

// ===== EMAIL VALIDATION =====
export function validateEmail(
  email: unknown,
  row: number,
): InviteImportError | null {
  const emailStr = toSafeString(email).trim();

  if (!emailStr) {
    return { row, field: 'email', value: email, reason: 'Email is required' };
  }

  if (!emailStr.endsWith(VALID_EMAIL_DOMAIN)) {
    return {
      row,
      field: 'email',
      email: emailStr,
      value: email,
      reason: `Email must end with ${VALID_EMAIL_DOMAIN}`,
    };
  }

  return null;
}

// ===== ROLE VALIDATION =====
export function validateRole(
  role: unknown,
  row: number,
): InviteImportError | null {
  const roleStr = toSafeString(role).trim().toUpperCase();

  if (!roleStr) {
    return { row, field: 'role', value: role, reason: 'Role is required' };
  }

  if (!Object.values(UserRole).includes(roleStr as UserRole)) {
    return {
      row,
      field: 'role',
      value: role,
      reason: `Invalid role. Must be: ${Object.values(UserRole).join(', ')}`,
    };
  }

  return null;
}

// ===== HIRE DATE VALIDATION =====
export function validateHireDate(
  hireDate: unknown,
  row: number,
): InviteImportError | null {
  if (!hireDate) {
    return {
      row,
      field: 'hireDate',
      value: hireDate,
      reason: 'Hire date is required',
    };
  }

  let date: Date;

  if (typeof hireDate === 'number') {
    // Excel serial date
    date = excelDateToJSDate(hireDate);
  } else if (hireDate instanceof Date) {
    date = hireDate;
  } else if (typeof hireDate === 'string') {
    date = new Date(hireDate);
  } else {
    return {
      row,
      field: 'hireDate',
      value: hireDate,
      reason: 'Invalid date format',
    };
  }

  if (isNaN(date.getTime())) {
    return {
      row,
      field: 'hireDate',
      value: hireDate,
      reason: 'Invalid date format',
    };
  }

  return null;
}

// ===== DATE FORMATTER =====
export function formatDate(value: unknown): string {
  let date: Date;

  if (typeof value === 'number') {
    date = excelDateToJSDate(value);
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    // Fallback to current date if invalid
    date = new Date();
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ===== HELPER FUNCTION =====
function excelDateToJSDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  return new Date(utcValue);
}
