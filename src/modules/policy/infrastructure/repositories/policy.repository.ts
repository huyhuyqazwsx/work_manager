import { Injectable } from '@nestjs/common';
import { IPolicyRepository } from '../../domain/repositories/policy.repository.interface';
import { PrismaLeaveConfigRepository } from './leave-config.repository';
import { PrismaOTConfigRepository } from './ot-config.repository';
import { PrismaPaidPersonalLeaveEventRepository } from './paid-personal-leave-event.repository';
import {
  ContractType,
  PaidPersonalEventCode,
} from '../../../../domain/enum/enum';
import { LeaveConfig } from '../../../../domain/entities/leave-config.entity';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';
import { PaidPersonalLeaveEvent } from '../../../../domain/entities/paid-personal-leave-event.entity';

@Injectable()
export class PrismaPolicyRepository implements IPolicyRepository {
  constructor(
    private readonly leaveConfigRepo: PrismaLeaveConfigRepository,
    private readonly otConfigRepo: PrismaOTConfigRepository,
    private readonly paidPersonalEventRepo: PrismaPaidPersonalLeaveEventRepository,
  ) {}
  async findLeaveConfigByContractType(
    contractType: ContractType,
  ): Promise<LeaveConfig | null> {
    return this.leaveConfigRepo.findByContractType(contractType);
  }

  async findLeaveConfigById(id: string): Promise<LeaveConfig | null> {
    return this.leaveConfigRepo.findById(id);
  }

  async findAllLeaveConfigs(): Promise<LeaveConfig[]> {
    return this.leaveConfigRepo.findAll();
  }

  async saveLeaveConfig(entity: LeaveConfig): Promise<void> {
    return this.leaveConfigRepo.save(entity);
  }

  async updateLeaveConfig(
    id: string,
    entity: Partial<LeaveConfig>,
  ): Promise<void> {
    return this.leaveConfigRepo.update(id, entity);
  }

  async deleteLeaveConfig(id: string): Promise<void> {
    return this.leaveConfigRepo.delete(id);
  }

  //OTConfig
  async findActiveOTConfig(): Promise<OTConfig | null> {
    return await this.otConfigRepo.findActive();
  }

  async findOTConfigById(id: string): Promise<OTConfig | null> {
    return this.otConfigRepo.findById(id);
  }

  async findAllOTConfigs(): Promise<OTConfig[]> {
    return this.otConfigRepo.findAll();
  }

  async saveOTConfig(entity: OTConfig): Promise<void> {
    return this.otConfigRepo.save(entity);
  }

  async updateOTConfig(id: string, entity: Partial<OTConfig>): Promise<void> {
    return this.otConfigRepo.update(id, entity);
  }

  async deleteOTConfig(id: string): Promise<void> {
    return this.otConfigRepo.delete(id);
  }

  //PaidPersonalLeaveEvent

  async findPaidPersonalEventByCode(
    code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent | null> {
    return this.paidPersonalEventRepo.findByCode(code);
  }

  async findAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]> {
    return this.paidPersonalEventRepo.findAll();
  }

  async savePaidPersonalEvent(entity: PaidPersonalLeaveEvent): Promise<void> {
    return this.paidPersonalEventRepo.save(entity);
  }

  async updatePaidPersonalEvent(
    id: string,
    entity: Partial<PaidPersonalLeaveEvent>,
  ): Promise<void> {
    return this.paidPersonalEventRepo.update(id, entity);
  }

  async deletePaidPersonalEvent(id: string): Promise<void> {
    return this.paidPersonalEventRepo.delete(id);
  }
}
