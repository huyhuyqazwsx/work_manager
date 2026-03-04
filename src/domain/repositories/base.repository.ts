export interface IBaseRepository<T> {
  findById(id: string, tx?: unknown): Promise<T | null>;
  findAll(tx?: unknown): Promise<T[]>;
  save(entity: T, tx?: unknown): Promise<void>;
  update(id: string, entity: Partial<T>, tx?: unknown): Promise<void>;
  delete(id: string, tx?: unknown): Promise<void>;

  createMany(entities: T[], tx?: unknown): Promise<number>;
  updateMany(
    where: Partial<T>,
    entity: Partial<T>,
    tx?: unknown,
  ): Promise<number>;
  deleteMany(where: Partial<T>, tx?: unknown): Promise<number>;
  runInTransaction<R>(fn: (tx: unknown) => Promise<R>): Promise<R>;
}
