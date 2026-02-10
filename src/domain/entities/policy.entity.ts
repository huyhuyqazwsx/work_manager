import { PolicyType } from '../enum/enum';

export class Policy {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly type: PolicyType,
    public priority: number,
    public isActive: boolean,
    public readonly leaveTypeId: string | null,
  ) {
    this.isActive = isActive ?? true;
  }

  updateName(name: string): void {
    this.name = name;
  }

  updatePriority(priority: number): void {
    if (priority > 0) {
      this.priority = priority;
    }
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  isLeavePolicy(): boolean {
    return this.type === PolicyType.LEAVE;
  }

  isOTPolicy(): boolean {
    return this.type === PolicyType.OT;
  }

  isEnabled(): boolean {
    return this.isActive;
  }

  isDisabled(): boolean {
    return !this.isActive;
  }

  hasHigherPriorityThan(other: Policy): boolean {
    return this.priority > other.priority;
  }

  hasLowerPriorityThan(other: Policy): boolean {
    return this.priority < other.priority;
  }
}
