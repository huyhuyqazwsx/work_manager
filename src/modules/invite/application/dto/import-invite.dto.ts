import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, ContractType } from '../../../../domain/enum/enum';

export class InviteFormDto {
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsEnum(ContractType)
  contractType: ContractType;

  @Type(() => Date)
  @IsDate({ message: 'joinDate must be a valid date' })
  joinDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'contractSignedDate must be a valid date' })
  contractSignedDate?: Date;

  @IsEnum(UserRole)
  role: UserRole;
}
