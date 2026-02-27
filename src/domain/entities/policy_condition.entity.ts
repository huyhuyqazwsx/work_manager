import { ContractType, UserRole } from '../enum/enum';

export class PolicyCondition {
  constructor(
    public readonly id: string,
    public readonly policyId: string,
    public minYear: number | null,
    public maxYear: number | null,
    public departmentId: string | null,
    public role: UserRole | null,
    public contractType: ContractType | null,
    public applyYear: number | null,
  ) {
    this.minYear = minYear ?? null;
    this.maxYear = maxYear ?? null;
    this.departmentId = departmentId ?? null;
    this.role = role ?? null;
    this.contractType = contractType ?? null;
    this.applyYear = applyYear ?? null;
  }

  matchesContractType(contractType: ContractType): boolean {
    if (this.contractType === null) return true;
    return this.contractType === contractType;
  }

  matchesApplyYear(year: number): boolean {
    if (this.applyYear === null) return true;
    return this.applyYear === year;
  }

  matches(params: {
    yearsOfService: number;
    departmentId?: string;
    role: UserRole;
    contractType: ContractType;
    applyYear?: number;
  }): boolean {
    if (!this.matchesYearsOfService(params.yearsOfService)) return false;
    if (params.departmentId && !this.matchesDepartment(params.departmentId))
      return false;
    if (!this.matchesRole(params.role)) return false;
    if (!this.matchesContractType(params.contractType)) return false;
    return !(params.applyYear && !this.matchesApplyYear(params.applyYear));
  }

  updateYearRange(minYear: number | null, maxYear: number | null): void {
    this.minYear = minYear;
    this.maxYear = maxYear;
  }

  updateDepartment(departmentId: string | null): void {
    this.departmentId = departmentId;
  }

  updateRole(role: UserRole | null): void {
    this.role = role;
  }

  matchesYearsOfService(years: number): boolean {
    if (this.minYear !== null && years < this.minYear) {
      return false;
    }
    return !(this.maxYear !== null && years > this.maxYear);
  }

  matchesDepartment(departmentId: string): boolean {
    if (this.departmentId === null) {
      return true;
    }
    return this.departmentId === departmentId;
  }

  matchesRole(role: UserRole): boolean {
    if (this.role === null) {
      return true;
    }
    return this.role === role;
  }

  hasYearRestriction(): boolean {
    return this.minYear !== null || this.maxYear !== null;
  }

  hasDepartmentRestriction(): boolean {
    return this.departmentId !== null;
  }

  hasRoleRestriction(): boolean {
    return this.role !== null;
  }

  hasAnyRestriction(): boolean {
    return (
      this.hasYearRestriction() ||
      this.hasDepartmentRestriction() ||
      this.hasRoleRestriction()
    );
  }
}
