import {
  ContractType,
  PaidPersonalEventCode,
} from '../../../../domain/enum/enum';
import { LeaveConfig } from '../../../../domain/entities/leave-config.entity';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';
import { PaidPersonalLeaveEvent } from '../../../../domain/entities/paid-personal-leave-event.entity';

export interface IPolicyRepository {
  // ===== LeaveConfig =====
  findLeaveConfigByContractType(
    contractType: ContractType,
  ): Promise<LeaveConfig | null>;

  findLeaveConfigById(id: string): Promise<LeaveConfig | null>;

  findAllLeaveConfigs(): Promise<LeaveConfig[]>;

  saveLeaveConfig(entity: LeaveConfig): Promise<void>;

  updateLeaveConfig(id: string, entity: Partial<LeaveConfig>): Promise<void>;

  deleteLeaveConfig(id: string): Promise<void>;

  // ===== OTConfig =====
  findActiveOTConfig(): Promise<OTConfig | null>;

  findOTConfigById(id: string): Promise<OTConfig | null>;

  findAllOTConfigs(): Promise<OTConfig[]>;

  saveOTConfig(entity: OTConfig): Promise<void>;

  updateOTConfig(id: string, entity: Partial<OTConfig>): Promise<void>;

  deleteOTConfig(id: string): Promise<void>;

  // ===== PaidPersonalLeaveEvent =====
  findAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]>;

  findPaidPersonalEventByCode(
    code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent | null>;

  savePaidPersonalEvent(entity: PaidPersonalLeaveEvent): Promise<void>;

  updatePaidPersonalEvent(
    id: string,
    entity: Partial<PaidPersonalLeaveEvent>,
  ): Promise<void>;

  deletePaidPersonalEvent(id: string): Promise<void>;
}
