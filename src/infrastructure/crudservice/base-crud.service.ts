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

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async findAll(): Promise<T[]> {
    return this.repository.findAll();
  }

  async create(entity: T): Promise<void> {
    await this.repository.save(entity);
  }

  async update(id: string, entity: Partial<T>): Promise<void> {
    await this.repository.update(id, entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
