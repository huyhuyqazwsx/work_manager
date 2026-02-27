import { LeaveTypeCode } from '../enum/enum';

export class LeaveType {
  public readonly createdAt: Date;

  constructor(
    public readonly id: string,
    public readonly code: LeaveTypeCode,
    public name: string,
    public isPaid: boolean,
    public deductCompensation: boolean,
    createdAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.isPaid = isPaid ?? false;
    this.deductCompensation = deductCompensation ?? false;
  }
  updateName(name: string): void {
    if (this.name !== name) {
      this.name = name;
    }
  }

  setPaid(isPaid: boolean): void {
    this.isPaid = isPaid;
  }

  setDeductCompensation(deductCompensation: boolean): void {
    this.deductCompensation = deductCompensation;
  }

  canUseCompensation(): boolean {
    return this.deductCompensation;
  }

  isPaidLeave(): boolean {
    return this.isPaid;
  }

  // ── bổ sung: type checking qua code ───────────────────
  isAnnualLeave(): boolean {
    return this.code === LeaveTypeCode.ANNUAL;
  }

  isCompensatoryLeave(): boolean {
    return this.code === LeaveTypeCode.COMPENSATORY;
  }

  isPaidPersonalLeave(): boolean {
    return this.code === LeaveTypeCode.PAID_PERSONAL;
  }

  isSocialInsuranceLeave(): boolean {
    return this.code === LeaveTypeCode.SOCIAL_INSURANCE;
  }
}
