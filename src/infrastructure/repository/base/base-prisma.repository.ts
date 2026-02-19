import { IBaseRepository } from '../../../domain/repositories/base.repository';
import { Prisma } from '@prisma/client';

export interface IBaseMapper<Domain, Persistence> {
  toDomain(raw: Persistence): Domain;
  toPersistence(entity: Domain | Partial<Domain>): Record<string, any>;
}

type PrismaDelegate<T> = {
  findUnique(args: { where: { id: string } }): Promise<T | null>;
  findFirst(args: { where: any }): Promise<T | null>;
  findMany(): Promise<T[]>;
  create(args: { data: any }): Promise<T>;
  update(args: { where: { id: string }; data: any }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<T>;
};

export abstract class BasePrismaRepository<
  Domain,
  Persistence,
> implements IBaseRepository<Domain> {
  protected constructor(
    protected readonly prismaModel: PrismaDelegate<Persistence>,
    protected readonly mapper?: IBaseMapper<Domain, Persistence>,
  ) {}

  async findById(id: string): Promise<Domain | null> {
    const raw = await this.prismaModel.findUnique({
      where: { id },
    });

    if (!raw) return null;
    return this.mapper ? this.mapper.toDomain(raw) : (raw as unknown as Domain);
  }

  async findAll(): Promise<Domain[]> {
    const raws = await this.prismaModel.findMany();
    return this.mapper
      ? raws.map((r) => this.mapper!.toDomain(r))
      : (raws as unknown as Domain[]);
  }

  async save(entity: Domain): Promise<void> {
    try {
      const data = this.mapper ? this.mapper.toPersistence(entity) : entity;

      await this.prismaModel.create({ data });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Unique constraint violation');
        }

        if (error.code === 'P2003') {
          throw new Error('Foreign key constraint failed');
        }
      }

      throw error;
    }
  }

  async update(id: string, entity: Partial<Domain>): Promise<void> {
    try {
      const data = this.mapper ? this.mapper.toPersistence(entity) : entity;

      await this.prismaModel.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Record not found');
        }
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prismaModel.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Record not found');
        }
      }
      throw error;
    }
  }
}
