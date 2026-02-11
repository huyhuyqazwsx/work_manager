import { UserRole } from '../enum/enum';

export interface InviteForm {
  email: string;
  role: UserRole;
  hireDate: string; // ISO string: yyyy-mm-dd
  departmentCode?: string;
}

export interface InviteImportError {
  row: number;
  field?: string; // 'email' | 'role' | 'hireDate' | 'departmentCode'
  email?: string; // Email value nếu có
  value?: any; // Giá trị bị lỗi
  reason: string; // Error message
}

export interface InviteImportResult {
  total: number;
  success: number;
  failed: number;
  validData: InviteForm[];
  errors: InviteImportError[];
}
