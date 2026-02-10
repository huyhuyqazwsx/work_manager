import { UserRole } from '../enum/enum';

export class PolicyCondition {
  constructor(
    public readonly id: string,
    public readonly policyId: string,
    public minYear: number | null,
    public maxYear: number | null,
    public departmentId: string | null,
    public role: UserRole | null,
  ) {
    this.minYear = minYear ?? null;
    this.maxYear = maxYear ?? null;
    this.departmentId = departmentId ?? null;
    this.role = role ?? null;
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

  matches(params: {
    yearsOfService: number;
    departmentId?: string;
    role: UserRole;
  }): boolean {
    if (!this.matchesYearsOfService(params.yearsOfService)) {
      return false;
    }

    if (params.departmentId && !this.matchesDepartment(params.departmentId)) {
      return false;
    }

    return this.matchesRole(params.role);
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
