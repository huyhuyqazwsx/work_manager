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

    public joinDate: Date | null,
    public contractSignedDate: Date | null,

    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.status = status ?? UserStatus.PENDING;
    this.role = role ?? UserRole.EMPLOYEE;
    this.contractSignedDate = contractSignedDate ?? null;
  }

  static fromPlain(plain: {
    id: string;
    code: string | null;
    email: string;
    fullName: string;
    gender: string;
    status: UserStatus;
    role: UserRole;
    departmentId: string;
    departmentName: string | null;
    position: string;
    contractType: ContractType;
    joinDate: Date | string | null;
    contractSignedDate: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }): UserAuth {
    return new UserAuth(
      plain.id,
      plain.code,
      plain.email,
      plain.fullName,
      plain.gender,
      plain.status,
      plain.role,
      plain.departmentId,
      plain.departmentName,
      plain.position,
      plain.contractType,
      plain.joinDate ? new Date(plain.joinDate) : null,
      plain.contractSignedDate ? new Date(plain.contractSignedDate) : null,
      plain.createdAt ? new Date(plain.createdAt) : undefined,
      plain.updatedAt ? new Date(plain.updatedAt) : undefined,
    );
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
    this.joinDate = joinDate;
    this.touch();
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
    if (this.contractType !== ContractType.OFFICIAL_EMPLOYEE) return 0;
    const now = new Date();
    const diffTime = now.getTime() - this.joinDate!.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
