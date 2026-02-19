import { UserRole, UserStatus } from '../enum/enum';

export class UserAuth {
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly email: string,
    public fullName: string,
    public gender: string,
    public status: UserStatus,
    public role: UserRole,
    public hireDate: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.status = status ?? UserStatus.PENDING;
    this.role = role ?? UserRole.EMPLOYEE;
    this.hireDate = hireDate ?? new Date();
  }

  updateFullName(fullName: string): void {
    if (this.fullName !== fullName) {
      this.fullName = fullName;
      this.touch();
    }
  }

  updateGender(gender: string): void {
    if (this.gender !== gender) {
      this.gender = gender;
      this.touch();
    }
  }

  updateRole(role: UserRole): void {
    if (this.role !== role) {
      this.role = role;
      this.touch();
    }
  }

  activate(): void {
    if (this.status !== UserStatus.ACTIVE) {
      this.status = UserStatus.ACTIVE;
      this.touch();
    }
  }

  inactivate(): void {
    if (this.status !== UserStatus.INACTIVE) {
      this.status = UserStatus.INACTIVE;
      this.touch();
    }
  }

  pending(): void {
    if (this.status !== UserStatus.PENDING) {
      this.status = UserStatus.PENDING;
      this.touch();
    }
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.status === UserStatus.PENDING;
  }

  isInactive(): boolean {
    return this.status === UserStatus.INACTIVE;
  }

  isEmployee(): boolean {
    return this.role === UserRole.EMPLOYEE;
  }

  isDepartmentHead(): boolean {
    return this.role === UserRole.DEPARTMENT_HEAD;
  }

  isHR(): boolean {
    return this.role === UserRole.HR;
  }

  isBOD(): boolean {
    return this.role === UserRole.BOD;
  }

  canApproveLeave(): boolean {
    return [UserRole.DEPARTMENT_HEAD, UserRole.HR, UserRole.BOD].includes(
      this.role,
    );
  }

  canApproveOT(): boolean {
    return [UserRole.DEPARTMENT_HEAD, UserRole.HR, UserRole.BOD].includes(
      this.role,
    );
  }

  getYearsOfService(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.hireDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
