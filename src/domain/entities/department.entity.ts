export class Department {
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,
    public name: string,
    public readonly code: string,
    public managerId: string,
    public isActive: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
    this.isActive = isActive ?? true;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateName(name: string): void {
    if (this.name !== name) {
      this.name = name;
      this.touch();
    }
  }

  changeManager(managerId: string): void {
    if (this.managerId !== managerId) {
      this.managerId = managerId;
      this.touch();
    }
  }

  activate(): void {
    if (!this.isActive) {
      this.isActive = true;
      this.touch();
    }
  }

  deactivate(): void {
    if (this.isActive) {
      this.isActive = false;
      this.touch();
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
