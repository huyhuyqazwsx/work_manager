import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPolicyService } from '../interfaces/policy.service.interface';
import * as policyRepositoryInterface from '../../domain/repositories/policy.repository.interface';
import { ContractType, PaidPersonalEventCode } from '@domain/enum/enum';
import { LeaveConfig } from '@domain/entities/leave-config.entity';
import { OTConfig } from '@domain/entities/ot-config.entity';
import { PaidPersonalLeaveEvent } from '@domain/entities/paid-personal-leave-event.entity';
import { AppError, AppException } from '@domain/errors';

@Injectable()
export class PolicyService implements IPolicyService {
  constructor(
    @Inject('IPolicyRepository')
    private readonly policyRepository: policyRepositoryInterface.IPolicyRepository,
  ) {}

  // ===== LeaveConfig =====

  async getLeaveConfig(contractType: ContractType): Promise<LeaveConfig> {
    const config =
      await this.policyRepository.findLeaveConfigByContractType(contractType);
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `Leave configuration not found for contract type "${contractType}"`,
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  async getLeaveConfigById(id: string): Promise<LeaveConfig> {
    const config = await this.policyRepository.findLeaveConfigById(id);
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `LeaveConfig not found with id "${id}"`,
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  async getAllLeaveConfigs(): Promise<LeaveConfig[]> {
    return this.policyRepository.findAllLeaveConfigs();
  }

  async createLeaveConfig(entity: LeaveConfig): Promise<void> {
    return this.policyRepository.saveLeaveConfig(entity);
  }

  async updateLeaveConfig(
    id: string,
    entity: Partial<LeaveConfig>,
  ): Promise<void> {
    await this.getLeaveConfigById(id);
    return this.policyRepository.updateLeaveConfig(id, entity);
  }

  async deleteLeaveConfig(id: string): Promise<void> {
    await this.getLeaveConfigById(id);
    return this.policyRepository.deleteLeaveConfig(id);
  }

  // ===== OTConfig =====

  async getActiveOTConfig(): Promise<OTConfig> {
    const config = await this.policyRepository.findActiveOTConfig();
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        'No active OT configuration found',
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  async getOTConfigById(id: string): Promise<OTConfig> {
    const config = await this.policyRepository.findOTConfigById(id);
    if (!config) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `OTConfig not found with id "${id}"`,
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  async getAllOTConfigs(): Promise<OTConfig[]> {
    return this.policyRepository.findAllOTConfigs();
  }

  async createOTConfig(entity: OTConfig): Promise<void> {
    return this.policyRepository.saveOTConfig(entity);
  }

  async updateOTConfig(id: string, entity: Partial<OTConfig>): Promise<void> {
    await this.getOTConfigById(id);
    return this.policyRepository.updateOTConfig(id, entity);
  }

  async deleteOTConfig(id: string): Promise<void> {
    await this.getOTConfigById(id);
    return this.policyRepository.deleteOTConfig(id);
  }

  // ===== PaidPersonalLeaveEvent =====

  async getPaidPersonalEvent(
    code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent> {
    const event = await this.policyRepository.findPaidPersonalEventByCode(code);
    if (!event) {
      throw new AppException(
        AppError.POLICY_NOT_FOUND,
        `Paid personal leave event "${code}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return event;
  }

  async findAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]> {
    return this.policyRepository.findAllPaidPersonalEvents();
  }

  async createPaidPersonalEvent(entity: PaidPersonalLeaveEvent): Promise<void> {
    return this.policyRepository.savePaidPersonalEvent(entity);
  }

  async updatePaidPersonalEvent(
    id: string,
    entity: Partial<PaidPersonalLeaveEvent>,
  ): Promise<void> {
    await this.getPaidPersonalEventById(id);
    return this.policyRepository.updatePaidPersonalEvent(id, entity);
  }

  async deletePaidPersonalEvent(id: string): Promise<void> {
    await this.getPaidPersonalEventById(id);
    return this.policyRepository.deletePaidPersonalEvent(id);
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
}
