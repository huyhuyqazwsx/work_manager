import { UserRole } from '../enum/enum';

export const InviteFormSchema = {
  email: {
    label: 'Email',
    example: 'user@company.com',
    required: true,
  },

  role: {
    label: 'Role',
    example: UserRole.EMPLOYEE,
    required: true,
    allowedValues: Object.values(UserRole),
  },

  hireDate: {
    label: 'Hire Date',
    example: '2026-01-15', // yyyy-mm-dd
    required: true,
    format: 'date',
  },

  departmentCode: {
    label: 'Department Code',
    example: '',
    required: false,
  },
} as const;
