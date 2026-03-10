import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';

export interface IBaseRepository<T> {
  findById(id: string, tx?: PrismaTransactionClient): Promise<T | null>;
  findAll(tx?: PrismaTransactionClient): Promise<T[]>;
  save(entity: T, tx?: PrismaTransactionClient): Promise<void>;
  update(
    id: string,
    entity: Partial<T>,
    tx?: PrismaTransactionClient,
  ): Promise<void>;
  delete(id: string, tx?: PrismaTransactionClient): Promise<void>;

  createMany(entities: T[], tx?: PrismaTransactionClient): Promise<number>;
  updateMany(
    where: Partial<T>,
    entity: Partial<T>,
    tx?: PrismaTransactionClient,
  ): Promise<number>;
  deleteMany(where: Partial<T>, tx?: PrismaTransactionClient): Promise<number>;
  runInTransaction<R>(
    fn: (tx: PrismaTransactionClient) => Promise<R>,
  ): Promise<R>;
}
