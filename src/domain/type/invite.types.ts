import { UserRole } from '../enum/enum';

export interface InviteExcelRow {
  email: string;
  role: UserRole;
}

export interface InviteImportError {
  row: number;
  email?: string;
  reason: string;
}

export interface InviteImportResult {
  total: number;
  success: number;
  failed: number;
  errors: InviteImportError[];
}
