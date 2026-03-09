import { ContractType, UserRole, UserStatus } from '@domain/enum/enum';

export class UserResponseDto {
  id: string;
  code: string | null;
  email: string;
  fullName: string;
  status: UserStatus;
  role: UserRole;

  departmentCode: string;
  contractType: ContractType;

  joinDate: Date;
  contractSignedDate: Date | null;
}
