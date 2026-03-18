export class Department {
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public name: string,
    public readonly code: string,
    public managerId: string | null,
    public isActive: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.isActive = isActive ?? true;
  }

  static fromPlain(plain: {
    id: string;
    name: string;
    code: string;
    managerId: string | null;
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }): Department {
    return new Department(
      plain.id,
      plain.name,
      plain.code,
      plain.managerId,
      plain.isActive,
      plain.createdAt ? new Date(plain.createdAt) : undefined,
      plain.updatedAt ? new Date(plain.updatedAt) : undefined,
    );
  }

  updateName(name: string): void {
    if (this.name !== name) {
      this.name = name;
      this.touch();
    }
  }

  changeManager(managerId: string | null): void {
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
    this.updatedAt = new Date();
  }
}
