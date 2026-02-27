import { ContractType, UserRole } from '../enum/enum';

export interface InviteForm {
  employeeCode?: string; // Code
  email: string;
  department: string;
  position?: string;
  contractType: ContractType;
  joinDate: Date;
  contractSignedDate?: Date;
  role: UserRole;
}

export interface InviteImportError {
  row: number;
  field?:
    | 'employeeCode'
    | 'email'
    | 'departmentCode'
    | 'position'
    | 'contractType'
    | 'hireDate'
    | 'contractSignedDate'
    | 'role';
  email?: string;
  value?: any;
  reason: string;
}

export interface InviteImportResult {
  total: number;
  success: number;
  failed: number;
  validData: InviteForm[];
  errors: InviteImportError[];
}
