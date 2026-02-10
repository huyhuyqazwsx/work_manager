import { AttendanceStatus } from '../enum/enum';

export class Attendance {
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly workDate: Date,
    public status: AttendanceStatus,
    public checkIn: Date | null,
    public checkOut: Date | null,
    public plan: string | null,
    public result: string | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
    this.status = status ?? AttendanceStatus.SCHEDULED;
    this.checkIn = checkIn ?? null;
    this.checkOut = checkOut ?? null;
    this.plan = plan ?? null;
    this.result = result ?? null;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updatePlan(plan: string): void {
    if (this.canEdit()) {
      this.plan = plan;
      this.touch();
    }
  }

  updateResult(result: string): void {
    if (this.isInProgress() || this.isCompleted()) {
      this.result = result;
      this.touch();
    }
  }

  performCheckIn(checkInTime?: Date): void {
    if (!this.checkIn) {
      this.checkIn = checkInTime ?? new Date();
      this.status = AttendanceStatus.IN_PROGRESS;
      this.touch();
    }
  }

  performCheckOut(checkOutTime?: Date): void {
    if (this.checkIn && !this.checkOut) {
      this.checkOut = checkOutTime ?? new Date();
      this.status = AttendanceStatus.COMPLETED;
      this.touch();
    }
  }

  complete(): void {
    if (this.isInProgress()) {
      this.status = AttendanceStatus.COMPLETED;
      this.touch();
    }
  }

  isScheduled(): boolean {
    return this.status === AttendanceStatus.SCHEDULED;
  }

  isInProgress(): boolean {
    return this.status === AttendanceStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === AttendanceStatus.COMPLETED;
  }

  hasCheckedIn(): boolean {
    return this.checkIn !== null;
  }

  hasCheckedOut(): boolean {
    return this.checkOut !== null;
  }

  canCheckIn(): boolean {
    return !this.hasCheckedIn();
  }

  canCheckOut(): boolean {
    return this.hasCheckedIn() && !this.hasCheckedOut();
  }

  canEdit(): boolean {
    return !this.isCompleted();
  }

  getWorkDuration(): number | null {
    if (this.checkIn && this.checkOut) {
      const diff = this.checkOut.getTime() - this.checkIn.getTime();
      return diff / (1000 * 60 * 60); // Convert to hours
    }
    return null;
  }

  isLateCheckIn(standardCheckInTime: Date): boolean {
    if (this.checkIn) {
      return this.checkIn.getTime() > standardCheckInTime.getTime();
    }
    return false;
  }

  isEarlyCheckOut(standardCheckOutTime: Date): boolean {
    if (this.checkOut) {
      return this.checkOut.getTime() < standardCheckOutTime.getTime();
    }
    return false;
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
