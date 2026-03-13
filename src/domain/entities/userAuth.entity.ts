import { ContractType, UserRole, UserStatus } from '../enum/enum';

export class UserAuth {
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly code: string | null,
    public readonly email: string,
    public fullName: string,
    public gender: string,
    public status: UserStatus,
    public role: UserRole,

    public departmentId: string,
    public departmentName: string | null,
    public position: string,
    public contractType: ContractType,

    public joinDate: Date,
    public contractSignedDate: Date | null,

    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.status = status ?? UserStatus.PENDING;
    this.role = role ?? UserRole.EMPLOYEE;
    this.joinDate = joinDate ?? new Date();
    this.contractSignedDate = contractSignedDate ?? null;
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

  updateDepartment(departmentId: string): void {
    if (this.departmentId !== departmentId) {
      this.departmentId = departmentId;
      this.touch();
    }
  }

  updatePosition(position: string): void {
    if (this.position !== position) {
      this.position = position;
      this.touch();
    }
  }

  updateContractType(contractType: ContractType): void {
    if (this.contractType !== contractType) {
      this.contractType = contractType;
      this.touch();
    }
  }

  updateJoinDate(joinDate: Date): void {
    if (this.joinDate.getTime() !== joinDate.getTime()) {
      this.joinDate = joinDate;
      this.touch();
    }
  }

  updateContractSignedDate(date: Date | null): void {
    if (
      (this.contractSignedDate?.getTime() ?? null) !== (date?.getTime() ?? null)
    ) {
      this.contractSignedDate = date;
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

  isOfficialEmployee(): boolean {
    return this.contractType === ContractType.OFFICIAL_EMPLOYEE;
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
    const diffTime = now.getTime() - this.joinDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
