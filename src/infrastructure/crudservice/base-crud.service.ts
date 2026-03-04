import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { NotFoundException } from '@nestjs/common';

interface ITransactionalRepository<T> {
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

export abstract class BaseCrudService<T> implements IBaseCrudService<T> {
  protected constructor(
    protected readonly repository: ITransactionalRepository<T>,
  ) {}

  protected async runInTransaction<R>(
    fn: (tx: unknown) => Promise<R>,
  ): Promise<R> {
    return this.repository.runInTransaction(fn);
  }

  async findById(id: string, tx?: unknown): Promise<T> {
    const entity = await this.repository.findById(id, tx);
    if (!entity) throw new NotFoundException('Entity not found');
    return entity;
  }

  async findAll(tx?: unknown): Promise<T[]> {
    return this.repository.findAll(tx);
  }

  async create(entity: T, tx?: unknown): Promise<void> {
    if (!entity) throw new Error('Entity is required');
    await this.repository.save(entity, tx);
  }

  async update(id: string, entity: Partial<T>, tx?: unknown): Promise<void> {
    const existing = await this.repository.findById(id, tx);
    if (!existing) throw new NotFoundException('Entity not found');
    await this.repository.update(id, entity, tx);
  }

  async delete(id: string, tx?: unknown): Promise<void> {
    const existing = await this.repository.findById(id, tx);
    if (!existing) throw new NotFoundException('Entity not found');
    await this.repository.delete(id, tx);
  }

  async createMany(entities: T[], tx?: unknown): Promise<number> {
    if (!entities?.length) throw new Error('Entities are required');
    return this.repository.createMany(entities, tx);
  }

  async updateMany(
    where: Partial<T>,
    entity: Partial<T>,
    tx?: unknown,
  ): Promise<number> {
    if (!where) throw new Error('Where condition is required');
    if (!entity) throw new Error('Entity is required');
    return this.repository.updateMany(where, entity, tx);
  }

  async deleteMany(where: Partial<T>, tx?: unknown): Promise<number> {
    if (!where) throw new Error('Where condition is required');
    return this.repository.deleteMany(where, tx);
  }
}
