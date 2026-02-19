import { NotFoundException } from '@nestjs/common';
import { IBaseCrudService } from '../../domain/crudservice/base-crud.service.interface';

export abstract class BaseCrudService<T> implements IBaseCrudService<T> {
  protected constructor(
    protected readonly repository: {
      findById(id: string): Promise<T | null>;
      findAll(): Promise<T[]>;
      save(entity: T): Promise<void>;
      update(id: string, entity: Partial<T>): Promise<void>;
      delete(id: string): Promise<void>;
    },
  ) {}

  async findById(id: string): Promise<T> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    return entity;
  }

  async findAll(): Promise<T[]> {
    return this.repository.findAll();
  }

  async create(entity: T): Promise<void> {
    if (!entity) {
      throw new Error('Entity is required');
    }

    await this.repository.save(entity);
  }

  async update(id: string, entity: Partial<T>): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Entity not found');
    }

    await this.repository.update(id, entity);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Entity not found');
    }

    await this.repository.delete(id);
  }
}
