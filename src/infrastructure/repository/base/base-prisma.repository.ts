import { IBaseRepository } from '@domain/repositories/base.repository';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/PrismaService';

export interface IBaseMapper<Domain, Persistence> {
  toDomain(raw: Persistence): Domain;
  toPersistence(entity: Domain | Partial<Domain>): Record<string, unknown>;
}

export type PrismaDelegate<T> = {
  findUnique(args: {
    where: { id: string };
    include?: Record<string, boolean | object>;
    select?: Partial<Record<keyof T, boolean>>;
  }): Promise<T | null>;

  findFirst(args?: {
    where?: Partial<T> | Record<string, unknown>;
    orderBy?:
      | Partial<Record<keyof T, 'asc' | 'desc'>>
      | Partial<Record<keyof T, 'asc' | 'desc'>>[];
    include?: Record<string, boolean | object>;
    select?: Partial<Record<keyof T, boolean>>;
    skip?: number;
    take?: number;
  }): Promise<T | null>;

  findMany(args?: {
    where?: Partial<T> | Record<string, unknown>;
    orderBy?:
      | Partial<Record<keyof T, 'asc' | 'desc'>>
      | Partial<Record<keyof T, 'asc' | 'desc'>>[];
    include?: Record<string, boolean | object>;
    select?: Partial<Record<keyof T, boolean>>;
    distinct?: (keyof T)[];
    skip?: number;
    take?: number;
  }): Promise<T[]>;

  create(args: {
    data: unknown;
    include?: Record<string, boolean | object>;
  }): Promise<T>;

  createMany(args: {
    data: unknown[];
    skipDuplicates?: boolean;
  }): Promise<{ count: number }>;

  update(args: {
    where: { id: string };
    data: unknown;
    include?: Record<string, boolean | object>;
  }): Promise<T>;

  updateMany(args: {
    where?: Partial<T> | Record<string, unknown>;
    data: unknown;
  }): Promise<{ count: number }>;

  delete(args: { where: { id: string } }): Promise<T>;

  deleteMany(args?: {
    where?: Partial<T> | Record<string, unknown>;
  }): Promise<{ count: number }>;

  count(args?: {
    where?: Partial<T> | Record<string, unknown>;
  }): Promise<number>;

  aggregate(args: {
    where?: Partial<T> | Record<string, unknown>;
    _sum?: Partial<Record<keyof T, boolean>>;
    _avg?: Partial<Record<keyof T, boolean>>;
    _min?: Partial<Record<keyof T, boolean>>;
    _max?: Partial<Record<keyof T, boolean>>;
    _count?: Partial<Record<keyof T, boolean>> | boolean;
  }): Promise<{
    _sum?: Partial<Record<keyof T, number | null>>;
    _avg?: Partial<Record<keyof T, number | null>>;
    _min?: Partial<Record<keyof T, number | null>>;
    _max?: Partial<Record<keyof T, number | null>>;
    _count?: Partial<Record<keyof T, number>> | number;
  }>;
};

export abstract class BasePrismaRepository<
  Domain,
  Persistence,
> implements IBaseRepository<Domain> {
  protected readonly prismaModel: PrismaDelegate<Persistence>;

  protected constructor(
    protected readonly prisma: PrismaService,
    prismaModel: PrismaDelegate<Persistence>,
    protected readonly mapper?: IBaseMapper<Domain, Persistence>,
  ) {
    this.prismaModel = prismaModel;
  }

  async runInTransaction<R>(fn: (tx: unknown) => Promise<R>): Promise<R> {
    return this.prisma.$transaction((tx) => fn(tx));
  }

  protected getModel(tx?: unknown): PrismaDelegate<Persistence> {
    if (!tx) return this.prismaModel;

    const modelName = this.getModelName();
    return (tx as Record<string, unknown>)[
      modelName
    ] as PrismaDelegate<Persistence>;
  }

  private getModelName(): string {
    const name = (this.prismaModel as unknown as { $name?: string }).$name;
    if (!name) throw new Error('Cannot detect model name from prismaModel');
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  private toDomain(raw: Persistence): Domain {
    return this.mapper ? this.mapper.toDomain(raw) : (raw as unknown as Domain);
  }

  private toPersistence(entity: Domain | Partial<Domain>): unknown {
    return this.mapper ? this.mapper.toPersistence(entity) : entity;
  }

  protected handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new Error('Unique constraint violation');
        case 'P2003':
          throw new Error('Foreign key constraint failed');
        case 'P2025':
          throw new Error('Record not found');
      }
    }
    throw error;
  }

  async findById(id: string, tx?: unknown): Promise<Domain | null> {
    const raw = await this.getModel(tx).findUnique({ where: { id } });
    if (!raw) return null;
    return this.toDomain(raw);
  }

  async findAll(tx?: unknown): Promise<Domain[]> {
    const raws = await this.getModel(tx).findMany();
    return raws.map((r) => this.toDomain(r));
  }

  async save(entity: Domain, tx?: unknown): Promise<void> {
    try {
      await this.getModel(tx).create({ data: this.toPersistence(entity) });
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(
    id: string,
    entity: Partial<Domain>,
    tx?: unknown,
  ): Promise<void> {
    try {
      await this.getModel(tx).update({
        where: { id },
        data: this.toPersistence(entity),
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string, tx?: unknown): Promise<void> {
    try {
      await this.getModel(tx).delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async createMany(entities: Domain[], tx?: unknown): Promise<number> {
    try {
      const result = await this.getModel(tx).createMany({
        data: entities.map((e) => this.toPersistence(e)),
      });
      return result.count;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMany(
    where: Partial<Domain>,
    entity: Partial<Domain>,
    tx?: unknown,
  ): Promise<number> {
    try {
      const result = await this.getModel(tx).updateMany({
        where,
        data: this.toPersistence(entity),
      });
      return result.count;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteMany(where: Partial<Domain>, tx?: unknown): Promise<number> {
    try {
      const result = await this.getModel(tx).deleteMany({ where });
      return result.count;
    } catch (error) {
      this.handleError(error);
    }
  }
}
