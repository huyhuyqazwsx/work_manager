import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPolicyService } from '../interfaces/policy.service.interface';
import * as policyRepositoryInterface from '../../domain/repositories/policy.repository.interface';
import * as cacheRepositoryInterface from '@domain/cache/cache.repository.interface';
import { ContractType, PaidPersonalEventCode } from '@domain/enum/enum';
import { LeaveConfig } from '@domain/entities/leave-config.entity';
import { OTConfig } from '@domain/entities/ot-config.entity';
import { PaidPersonalLeaveEvent } from '@domain/entities/paid-personal-leave-event.entity';
import { AppError, AppException } from '@domain/errors';

const CACHE_TTL = 60 * 60 * 24; // 24h — ít thay đổi

const CACHE_KEYS = {
  leaveConfig: (contractType: string) => `policy:leave-config:${contractType}`,
  leaveConfigById: (id: string) => `policy:leave-config-id:${id}`,
  allLeaveConfigs: () => `policy:leave-configs:all`,
  otConfig: (id: string) => `policy:ot-config:${id}`,
  activeOTConfig: () => `policy:ot-config:active`,
  allOTConfigs: () => `policy:ot-configs:all`,
  paidPersonalEvent: (code: string) => `policy:paid-personal-event:${code}`,
  allPaidPersonalEvents: () => `policy:paid-personal-events:all`,
};

@Injectable()
export class PolicyService implements IPolicyService {
  constructor(
    @Inject('IPolicyRepository')
    private readonly policyRepository: policyRepositoryInterface.IPolicyRepository,
    @Inject('ICacheRepository')
    private readonly cache: cacheRepositoryInterface.ICacheRepository,
  ) {}

  // ===== LeaveConfig =====

  async getLeaveConfig(contractType: ContractType): Promise<LeaveConfig> {
    const key = CACHE_KEYS.leaveConfig(contractType);
    const cached = await this.cache.get<LeaveConfig>(key);
    if (cached) return LeaveConfig.fromPlain(cached);

    const config =
      await this.policyRepository.findLeaveConfigByContractType(contractType);
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `Leave configuration not found for contract type "${contractType}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cache.set(key, config, CACHE_TTL);
    return config;
  }

  async getLeaveConfigById(id: string): Promise<LeaveConfig> {
    const key = CACHE_KEYS.leaveConfigById(id);
    const cached = await this.cache.get<LeaveConfig>(key);
    if (cached) return LeaveConfig.fromPlain(cached);

    const config = await this.policyRepository.findLeaveConfigById(id);
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `LeaveConfig not found with id "${id}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cache.set(key, config, CACHE_TTL);
    return config;
  }

  async getAllLeaveConfigs(): Promise<LeaveConfig[]> {
    const key = CACHE_KEYS.allLeaveConfigs();
    const cached = await this.cache.get<LeaveConfig[]>(key);
    if (cached) return cached.map((c) => LeaveConfig.fromPlain(c));

    const configs = await this.policyRepository.findAllLeaveConfigs();
    await this.cache.set(key, configs, CACHE_TTL);
    return configs;
  }

  async createLeaveConfig(entity: LeaveConfig): Promise<void> {
    await this.policyRepository.saveLeaveConfig(entity);
    await this.invalidateLeaveConfigCache(entity.contractType);
  }

  async updateLeaveConfig(
    id: string,
    entity: Partial<LeaveConfig>,
  ): Promise<void> {
    const existing = await this.getLeaveConfigById(id);
    await this.policyRepository.updateLeaveConfig(id, entity);
    await this.invalidateLeaveConfigCache(existing.contractType, id);
  }

  async deleteLeaveConfig(id: string): Promise<void> {
    const existing = await this.getLeaveConfigById(id);
    await this.policyRepository.deleteLeaveConfig(id);
    await this.invalidateLeaveConfigCache(existing.contractType, id);
  }

  // ===== OTConfig =====

  async getActiveOTConfig(): Promise<OTConfig> {
    const key = CACHE_KEYS.activeOTConfig();
    const cached = await this.cache.get<OTConfig>(key);
    if (cached) return OTConfig.fromPlain(cached);

    const config = await this.policyRepository.findActiveOTConfig();
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        'No active OT configuration found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cache.set(key, config, CACHE_TTL);
    return config;
  }

  async getOTConfigById(id: string): Promise<OTConfig> {
    const key = CACHE_KEYS.otConfig(id);
    const cached = await this.cache.get<OTConfig>(key);
    if (cached) return OTConfig.fromPlain(cached);

    const config = await this.policyRepository.findOTConfigById(id);
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `OTConfig not found with id "${id}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cache.set(key, config, CACHE_TTL);
    return config;
  }

  async getAllOTConfigs(): Promise<OTConfig[]> {
    const key = CACHE_KEYS.allOTConfigs();
    const cached = await this.cache.get<OTConfig[]>(key);
    if (cached) return cached.map((c) => OTConfig.fromPlain(c));

    const configs = await this.policyRepository.findAllOTConfigs();
    await this.cache.set(key, configs, CACHE_TTL);
    return configs;
  }

  async createOTConfig(entity: OTConfig): Promise<void> {
    await this.policyRepository.saveOTConfig(entity);
    await this.invalidateOTConfigCache(entity.id);
  }

  async updateOTConfig(id: string, entity: Partial<OTConfig>): Promise<void> {
    await this.getOTConfigById(id);
    await this.policyRepository.updateOTConfig(id, entity);
    await this.invalidateOTConfigCache(id);
  }

  async deleteOTConfig(id: string): Promise<void> {
    await this.getOTConfigById(id);
    await this.policyRepository.deleteOTConfig(id);
    await this.invalidateOTConfigCache(id);
  }

  // ===== PaidPersonalLeaveEvent =====

  async getPaidPersonalEvent(
    code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent> {
    const key = CACHE_KEYS.paidPersonalEvent(code);
    const cached = await this.cache.get<PaidPersonalLeaveEvent>(key);
    if (cached) return PaidPersonalLeaveEvent.fromPlain(cached);

    const event = await this.policyRepository.findPaidPersonalEventByCode(code);
    if (!event) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `Paid personal leave event "${code}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.cache.set(key, event, CACHE_TTL);
    return event;
  }

  async findAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]> {
    const key = CACHE_KEYS.allPaidPersonalEvents();
    const cached = await this.cache.get<PaidPersonalLeaveEvent[]>(key);
    if (cached) return cached.map((c) => PaidPersonalLeaveEvent.fromPlain(c));

    const events = await this.policyRepository.findAllPaidPersonalEvents();
    await this.cache.set(key, events, CACHE_TTL);
    return events;
  }

  async createPaidPersonalEvent(entity: PaidPersonalLeaveEvent): Promise<void> {
    await this.policyRepository.savePaidPersonalEvent(entity);
    await this.invalidatePaidPersonalEventCache(entity.code);
  }

  async updatePaidPersonalEvent(
    id: string,
    entity: Partial<PaidPersonalLeaveEvent>,
  ): Promise<void> {
    const existing = await this.getPaidPersonalEventById(id);
    await this.policyRepository.updatePaidPersonalEvent(id, entity);
    await this.invalidatePaidPersonalEventCache(existing.code);
  }

  async deletePaidPersonalEvent(id: string): Promise<void> {
    const existing = await this.getPaidPersonalEventById(id);
    await this.policyRepository.deletePaidPersonalEvent(id);
    await this.invalidatePaidPersonalEventCache(existing.code);
  }

  // ===== Private =====

  private async getPaidPersonalEventById(
    id: string,
  ): Promise<PaidPersonalLeaveEvent> {
    const all = await this.policyRepository.findAllPaidPersonalEvents();
    const existing = all.find((e) => e.id === id);
    if (!existing) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `PaidPersonalLeaveEvent not found with id "${id}"`,
        HttpStatus.NOT_FOUND,
      );
    }
    return existing;
  }

  private async invalidateLeaveConfigCache(
    contractType: ContractType,
    id?: string,
  ): Promise<void> {
    await this.cache.delete(CACHE_KEYS.leaveConfig(contractType));
    await this.cache.delete(CACHE_KEYS.allLeaveConfigs());
    if (id) {
      await this.cache.delete(CACHE_KEYS.leaveConfigById(id));
    }
  }

  private async invalidateOTConfigCache(id: string): Promise<void> {
    await Promise.all([
      this.cache.delete(CACHE_KEYS.otConfig(id)),
      this.cache.delete(CACHE_KEYS.activeOTConfig()),
      this.cache.delete(CACHE_KEYS.allOTConfigs()),
    ]);
  }

  private async invalidatePaidPersonalEventCache(code: string): Promise<void> {
    await Promise.all([
      this.cache.delete(CACHE_KEYS.paidPersonalEvent(code)),
      this.cache.delete(CACHE_KEYS.allPaidPersonalEvents()),
    ]);
  }
}
