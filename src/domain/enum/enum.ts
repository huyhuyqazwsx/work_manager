export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  HR = 'HR',
  BOD = 'BOD',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

// Leave Request enums
export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// Holiday enums
export enum HolidayType {
  FIXED = 'FIXED',
  CUSTOM = 'CUSTOM',
}

export enum HolidaySession {
  FULL = 'FULL',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

export enum ContractType {
  INTERN = 'INTERN',
  TRAINEE = 'TRAINEE',
  PROBATION = 'PROBATION',
  OFFICIAL_EMPLOYEE = 'OFFICIAL_EMPLOYEE',
}

export enum LeaveTypeCode {
  ANNUAL = 'ANNUAL_LEAVE',
  COMPENSATORY = 'COMPENSATORY_LEAVE',
  PAID_PERSONAL = 'PAID_PERSONAL_LEAVE',
  SOCIAL_INSURANCE = 'SOCIAL_INSURANCE_LEAVE',
}

export enum PaidPersonalEventCode {
  SELF_MARRIAGE = 'SELF_MARRIAGE', // Bản thân kết hôn - 3 ngày
  CHILD_MARRIAGE = 'CHILD_MARRIAGE', // Con kết hôn - 1 ngày
  FUNERAL = 'FUNERAL', // Ma chay - 3 ngày
}

export enum OTType {
  COMPENSATION = 'COMPENSATION',
  SALARY = 'SALARY',
}

export enum OTPlanStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum OTTicketStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum CompensationTransactionType {
  EARNED = 'EARNED',
  USED = 'USED',
}

export enum EmailType {
  INVITE = 'INVITE',
}
