import { Prisma } from '@prisma/client';

export class EmailQueue {
  public readonly createdAt: Date;

  constructor(
    public readonly id: string,
    public readonly emailSend: string | null,
    public readonly emailCC: string[],
    public readonly type: string,
    public readonly payload: Prisma.JsonValue,
    createdAt?: Date,
  ) {
    this.createdAt = createdAt ?? new Date();
  }
}
