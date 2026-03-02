import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import * as policyServiceInterface from '../../application/interfaces/policy.service.interface';
import { LeaveConfig } from '../../../../domain/entities/leave-config.entity';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';
import { PaidPersonalLeaveEvent } from '../../../../domain/entities/paid-personal-leave-event.entity';
import {
  ContractType,
  PaidPersonalEventCode,
} from '../../../../domain/enum/enum';

@Controller('policy')
export class PolicyController {
  constructor(
    @Inject('IPolicyService')
    private readonly policyService: policyServiceInterface.IPolicyService,
  ) {}

  // ===== LeaveConfig =====

  @Get('leave-config')
  async getAllLeaveConfigs(): Promise<LeaveConfig[]> {
    return this.policyService.getAllLeaveConfigs();
  }

  @Get('leave-config/:id')
  async getLeaveConfigById(@Param('id') id: string): Promise<LeaveConfig> {
    return this.policyService.getLeaveConfigById(id);
  }

  @Get('leave-config/contract/:contractType')
  async getLeaveConfigByContractType(
    @Param('contractType') contractType: ContractType,
  ): Promise<LeaveConfig> {
    return this.policyService.getLeaveConfig(contractType);
  }

  @Post('leave-config')
  async createLeaveConfig(@Body() entity: LeaveConfig): Promise<void> {
    return this.policyService.createLeaveConfig(entity);
  }

  @Put('leave-config/:id')
  async updateLeaveConfig(
    @Param('id') id: string,
    @Body() entity: Partial<LeaveConfig>,
  ): Promise<void> {
    return this.policyService.updateLeaveConfig(id, entity);
  }

  @Delete('leave-config/:id')
  async deleteLeaveConfig(@Param('id') id: string): Promise<void> {
    return this.policyService.deleteLeaveConfig(id);
  }

  // ===== OTConfig =====

  @Get('ot-config')
  async getAllOTConfigs(): Promise<OTConfig[]> {
    return this.policyService.getAllOTConfigs();
  }

  @Get('ot-config/:id')
  async getOTConfigById(@Param('id') id: string): Promise<OTConfig> {
    return this.policyService.getOTConfigById(id);
  }

  @Get('ot-config/contract/:contractType')
  async getOTConfigByContractType(
    @Param('contractType') contractType: ContractType,
  ): Promise<OTConfig | null> {
    return this.policyService.getOTConfig(contractType);
  }

  @Post('ot-config')
  async createOTConfig(@Body() entity: OTConfig): Promise<void> {
    return this.policyService.createOTConfig(entity);
  }

  @Put('ot-config/:id')
  async updateOTConfig(
    @Param('id') id: string,
    @Body() entity: Partial<OTConfig>,
  ): Promise<void> {
    return this.policyService.updateOTConfig(id, entity);
  }

  @Delete('ot-config/:id')
  async deleteOTConfig(@Param('id') id: string): Promise<void> {
    return this.policyService.deleteOTConfig(id);
  }

  // ===== PaidPersonalLeaveEvent =====

  @Get('paid-personal-event')
  async getAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]> {
    return this.policyService.findAllPaidPersonalEvents();
  }

  @Get('paid-personal-event/:code')
  async getPaidPersonalEventByCode(
    @Param('code') code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent> {
    return this.policyService.getPaidPersonalEvent(code);
  }

  @Post('paid-personal-event')
  async createPaidPersonalEvent(
    @Body() entity: PaidPersonalLeaveEvent,
  ): Promise<void> {
    return this.policyService.createPaidPersonalEvent(entity);
  }

  @Put('paid-personal-event/:id')
  async updatePaidPersonalEvent(
    @Param('id') id: string,
    @Body() entity: Partial<PaidPersonalLeaveEvent>,
  ): Promise<void> {
    return this.policyService.updatePaidPersonalEvent(id, entity);
  }

  @Delete('paid-personal-event/:id')
  async deletePaidPersonalEvent(@Param('id') id: string): Promise<void> {
    return this.policyService.deletePaidPersonalEvent(id);
  }
}
