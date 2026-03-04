import { Prisma } from '@prisma/client';

export class EmailQueue {
  public readonly createdAt: Date;

  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly type: string,
    public readonly payload: Prisma.JsonValue,
    createdAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
  }
}
