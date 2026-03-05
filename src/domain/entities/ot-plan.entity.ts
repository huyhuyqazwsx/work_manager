import { OTPlanStatus } from '../enum/enum';
import { OTTicket } from '@domain/entities/ot-ticket.entity';

export class OTPlan {
  public rejectedAt?: Date;
  public approvedAt?: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly departmentId: string,
    public readonly managerId: string,
    public reason: string,
    public status: OTPlanStatus,
    public rejectedBy: string | null,
    public rejectionNote: string | null,
    public approvedBy: string | null,
    public tickets: OTTicket[],
    createdAt?: Date,
    updatedAt?: Date,
    rejectedAt?: Date,
    approvedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.rejectedAt = rejectedAt;
    this.approvedAt = approvedAt;
    this.status = status ?? OTPlanStatus.DRAFT;
  }

  submit(): void {
    if (this.isDraft()) {
      this.status = OTPlanStatus.PENDING;
      this.touch();
    }
  }

  approve(approvedBy: string): void {
    if (this.isPending()) {
      this.status = OTPlanStatus.APPROVED;
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();
      this.touch();
    }
  }

  reject(rejectedBy: string, note: string): void {
    if (this.isPending()) {
      this.status = OTPlanStatus.REJECTED;
      this.rejectedBy = rejectedBy;
      this.rejectionNote = note;
      this.rejectedAt = new Date();
      this.touch();
    }
  }

  backToDraft(): void {
    if (this.isRejected()) {
      this.status = OTPlanStatus.DRAFT;
      this.rejectedBy = null;
      this.rejectionNote = null;
      this.rejectedAt = undefined;
      this.touch();
    }
  }

  isDraft(): boolean {
    return this.status === OTPlanStatus.DRAFT;
  }
  isPending(): boolean {
    return this.status === OTPlanStatus.PENDING;
  }
  isApproved(): boolean {
    return this.status === OTPlanStatus.APPROVED;
  }
  isRejected(): boolean {
    return this.status === OTPlanStatus.REJECTED;
  }

  canEdit(): boolean {
    return this.isDraft();
  }
  canSubmit(): boolean {
    return this.isDraft() && this.tickets.length > 0;
  }
  canApprove(): boolean {
    return this.isPending();
  }
  canReject(): boolean {
    return this.isPending();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
