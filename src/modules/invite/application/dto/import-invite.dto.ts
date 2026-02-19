import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { UserRole } from '../../../../domain/enum/enum';

export class InviteFormDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @Matches(/^[^\s@]+@skysolution\.com$/, {
    message: 'Email must end with @skysolution.com',
  })
  email: string;

  @IsEnum(UserRole, { message: 'Invalid role value' })
  role: UserRole;

  @Matches(/^\d{1,2}\/\d{1,2}\/\d{4}$/, {
    message: 'hireDate must be in format D/M/YYYY (e.g., 16/2/2026)',
  })
  hireDate: string;

  @IsOptional()
  @IsString()
  departmentCode?: string;
}
