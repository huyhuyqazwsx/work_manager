import { LeaveRequestStatus } from '../enum/enum';

export class LeaveRequest {
  public readonly createdAt: Date;
  private _approvedAt?: Date;

  constructor(
    public readonly id: string,
    public readonly leaveTypeId: string,
    public status: LeaveRequestStatus,
    public readonly fromDate: Date,
    public readonly toDate: Date,
    public readonly totalDays: number,
    public reason: string | null,
    public readonly createdBy: string,
    public approvedBy: string | null,
    createdAt?: Date,
    approvedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this._approvedAt = approvedAt;
    this.status = status ?? LeaveRequestStatus.DRAFT;
    this.approvedBy = approvedBy ?? null;
  }

  get approvedAt(): Date | undefined {
    return this._approvedAt;
  }

  updateReason(reason: string): void {
    if (this.isDraft()) {
      this.reason = reason;
    }
  }

  submit(): void {
    if (this.isDraft()) {
      this.status = LeaveRequestStatus.PENDING;
    }
  }

  approve(approvedBy: string): void {
    if (this.isPending()) {
      this.status = LeaveRequestStatus.APPROVED;
      this.approvedBy = approvedBy;
      this._approvedAt = new Date();
    }
  }

  reject(approvedBy: string): void {
    if (this.isPending()) {
      this.status = LeaveRequestStatus.REJECTED;
      this.approvedBy = approvedBy;
      this._approvedAt = new Date();
    }
  }

  cancel(): void {
    if (this.isPending()) {
      this.status = LeaveRequestStatus.DRAFT;
    }
  }

  isDraft(): boolean {
    return this.status === LeaveRequestStatus.DRAFT;
  }

  isPending(): boolean {
    return this.status === LeaveRequestStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === LeaveRequestStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === LeaveRequestStatus.REJECTED;
  }

  canEdit(): boolean {
    return this.isDraft();
  }

  canSubmit(): boolean {
    return this.isDraft();
  }

  canApprove(): boolean {
    return this.isPending();
  }

  canReject(): boolean {
    return this.isPending();
  }

  canCancel(): boolean {
    return this.isPending();
  }

  getDuration(): number {
    return this.totalDays;
  }

  getDateRange(): { from: Date; to: Date } {
    return {
      from: this.fromDate,
      to: this.toDate,
    };
  }
}
