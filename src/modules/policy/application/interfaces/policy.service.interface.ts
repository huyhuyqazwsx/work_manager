import {
  ContractType,
  PaidPersonalEventCode,
} from '../../../../domain/enum/enum';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';
import { LeaveConfig } from '../../../../domain/entities/leave-config.entity';
import { PaidPersonalLeaveEvent } from '../../../../domain/entities/paid-personal-leave-event.entity';

export interface IPolicyService {
  // ===== LeaveConfig =====
  getLeaveConfig(contractType: ContractType): Promise<LeaveConfig>;
  getLeaveConfigById(id: string): Promise<LeaveConfig>;
  getAllLeaveConfigs(): Promise<LeaveConfig[]>;
  createLeaveConfig(entity: LeaveConfig): Promise<void>;
  updateLeaveConfig(id: string, entity: Partial<LeaveConfig>): Promise<void>;
  deleteLeaveConfig(id: string): Promise<void>;

  // ===== OTConfig =====
  getOTConfig(contractType: ContractType): Promise<OTConfig | null>;
  getOTConfigById(id: string): Promise<OTConfig>;
  getAllOTConfigs(): Promise<OTConfig[]>;
  createOTConfig(entity: OTConfig): Promise<void>;
  updateOTConfig(id: string, entity: Partial<OTConfig>): Promise<void>;
  deleteOTConfig(id: string): Promise<void>;

  // ===== PaidPersonalLeaveEvent =====
  getPaidPersonalEvent(
    code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent>;
  findAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]>;
  createPaidPersonalEvent(entity: PaidPersonalLeaveEvent): Promise<void>;
  updatePaidPersonalEvent(
    id: string,
    entity: Partial<PaidPersonalLeaveEvent>,
  ): Promise<void>;
  deletePaidPersonalEvent(id: string): Promise<void>;
}
