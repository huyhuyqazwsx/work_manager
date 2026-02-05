import { UserStatus } from '../../modules/auth/domain/enum/user-status.enum';

export class User {
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly email: string,
    public gender: string,
    public status: UserStatus,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateGender(gender: string): void {
    if (this.gender !== gender) {
      this.gender = gender;
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

  private touch(): void {
    this._updatedAt = new Date();
  }
}
