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
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Overtime Request enums
export enum OvertimeRequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Attendance enums
export enum AttendanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
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

// Policy enums
export enum PolicyType {
  LEAVE = 'LEAVE',
  OT = 'OT',
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
