import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { Department } from '@domain/entities/department.entity';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import * as cacheRepositoryInterface from '@domain/cache/cache.repository.interface';
import { IDepartmentService } from '../interfaces/department.service.interface';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';

const CACHE_TTL = 60 * 60; // 1h
const CACHE_KEYS = {
  all: () => 'departments:all',
  byId: (id: string) => `department:id:${id}`,
};

@Injectable()
export class DepartmentService
  extends BaseCrudService<Department>
  implements IDepartmentService
{
  constructor(
    @Inject('IDepartmentRepository')
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
    @Inject('ICacheRepository')
    private readonly cache: cacheRepositoryInterface.ICacheRepository,
  ) {
    super(departmentRepository);
  }

  async findAll(tx?: PrismaTransactionClient): Promise<Department[]> {
    const key = CACHE_KEYS.all();
    const cached = await this.cache.get<Department[]>(key);
    if (cached) return cached;

    const result = await this.departmentRepository.findAll(tx);
    await this.cache.set(key, result, CACHE_TTL);
    return result;
  }

  async findById(
    id: string,
    tx?: PrismaTransactionClient,
  ): Promise<Department> {
    const key = CACHE_KEYS.byId(id);
    const cached = await this.cache.get<Department>(key);
    if (cached) return cached;

    const result = await super.findById(id, tx);
    await this.cache.set(key, result, CACHE_TTL);
    return result;
  }

  async create(
    entity: Department,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    await super.create(entity, tx);
    await this.invalidateCache();
  }

  async update(
    id: string,
    entity: Partial<Department>,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    await super.update(id, entity, tx);
    await this.invalidateCache(id);
  }

  async delete(id: string, tx?: PrismaTransactionClient): Promise<void> {
    await super.delete(id, tx);
    await this.invalidateCache(id);
  }

  async findByName(name: string): Promise<Department | null> {
    return this.departmentRepository.findByName(name);
  }

  async findByManagerId(id: string): Promise<Department | null> {
    return this.departmentRepository.findByManagerId(id);
  }

  // ===== Private =====

  private async invalidateCache(id?: string): Promise<void> {
    await this.cache.delete(CACHE_KEYS.all());
    if (id) await this.cache.delete(CACHE_KEYS.byId(id));
  }
}
