import { OvertimeRequestStatus } from '../enum/enum';

export class OvertimeRequest {
  public readonly createdAt: Date;
  private _updatedAt: Date;
  private _approvedAt?: Date;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly workDate: Date,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly totalHours: number,
    public readonly otTypeId: string,
    public status: OvertimeRequestStatus,
    public reason: string | null,
    public approvedBy: string | null,
    createdAt?: Date,
    updatedAt?: Date,
    approvedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
    this._approvedAt = approvedAt;
    this.status = status ?? OvertimeRequestStatus.DRAFT;
    this.approvedBy = approvedBy ?? null;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get approvedAt(): Date | undefined {
    return this._approvedAt;
  }

  updateReason(reason: string): void {
    if (this.isDraft()) {
      this.reason = reason;
      this.touch();
    }
  }

  submit(): void {
    if (this.isDraft()) {
      this.status = OvertimeRequestStatus.PENDING;
      this.touch();
    }
  }

  approve(approvedBy: string): void {
    if (this.isPending()) {
      this.status = OvertimeRequestStatus.APPROVED;
      this.approvedBy = approvedBy;
      this._approvedAt = new Date();
      this.touch();
    }
  }

  reject(approvedBy: string): void {
    if (this.isPending()) {
      this.status = OvertimeRequestStatus.REJECTED;
      this.approvedBy = approvedBy;
      this._approvedAt = new Date();
      this.touch();
    }
  }

  cancel(): void {
    if (this.isPending()) {
      this.status = OvertimeRequestStatus.DRAFT;
      this.touch();
    }
  }

  isDraft(): boolean {
    return this.status === OvertimeRequestStatus.DRAFT;
  }

  isPending(): boolean {
    return this.status === OvertimeRequestStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === OvertimeRequestStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === OvertimeRequestStatus.REJECTED;
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

  getHours(): number {
    return this.totalHours;
  }

  getTimeRange(): { start: Date; end: Date } {
    return {
      start: this.startTime,
      end: this.endTime,
    };
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
