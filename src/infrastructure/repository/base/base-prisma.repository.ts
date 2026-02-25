import { IBaseRepository } from '../../../domain/repositories/base.repository';
import { Prisma } from '@prisma/client';

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

  update(args: {
    where: { id: string };
    data: unknown;
    include?: Record<string, boolean | object>;
  }): Promise<T>;

  delete(args: { where: { id: string } }): Promise<T>;

  count(args?: {
    where?: Partial<T> | Record<string, unknown>;
  }): Promise<number>;
};

export abstract class BasePrismaRepository<
  Domain,
  Persistence,
> implements IBaseRepository<Domain> {
  protected constructor(
    protected readonly prismaModel: PrismaDelegate<Persistence>,
    protected readonly mapper?: IBaseMapper<Domain, Persistence>,
  ) {}

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

  async findById(id: string): Promise<Domain | null> {
    const raw = await this.prismaModel.findUnique({ where: { id } });
    if (!raw) return null;
    return this.toDomain(raw);
  }

  async findAll(): Promise<Domain[]> {
    const raws = await this.prismaModel.findMany();
    return raws.map((r) => this.toDomain(r));
  }

  async save(entity: Domain): Promise<void> {
    try {
      await this.prismaModel.create({ data: this.toPersistence(entity) });
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, entity: Partial<Domain>): Promise<void> {
    try {
      await this.prismaModel.update({
        where: { id },
        data: this.toPersistence(entity),
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prismaModel.delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }
}
