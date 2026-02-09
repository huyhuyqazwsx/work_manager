import { UserStatus } from '../../../modules/user/domain/enum/user-status.enum';
import { UserRole } from '../../../modules/user/domain/enum/user-role.enum';

export class UserAuth {
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly email: string,
    public gender: string,
    public status: UserStatus,
    public role: UserRole,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
    this.gender = gender ?? 'null';
    this.status = status ?? UserStatus.PENDING;
    this.role = role ?? UserRole.EMPLOYEE;
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

  updateUserRole(role: UserRole): void {
    if (this.role !== role) {
      this.role = role;
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
