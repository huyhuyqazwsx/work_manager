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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as policyServiceInterface from '../../application/interfaces/policy.service.interface';
import { LeaveConfig } from '../../../../domain/entities/leave-config.entity';
import { OTConfig } from '../../../../domain/entities/ot-config.entity';
import { PaidPersonalLeaveEvent } from '../../../../domain/entities/paid-personal-leave-event.entity';
import {
  ContractType,
  PaidPersonalEventCode,
} from '../../../../domain/enum/enum';
import { UpdateLeaveConfigDto } from '../../application/dto/update-leave-config.dto';
import { randomUUID } from 'node:crypto';
import { CreateLeaveConfigDto } from '../../application/dto/create-leave-config.dto';
import { CreateOTConfigDto } from '../../application/dto/create-ot-config.dto';
import { UpdateOTConfigDto } from '../../application/dto/update-ot-config.dto';
import { UpdatePaidPersonalEventDto } from '../../application/dto/update-paid-personal-event.dto';
import { CreatePaidPersonalEventDto } from '../../application/dto/create-paid-personal-event.dto';

@ApiTags('Policy')
@Controller('policy')
export class PolicyController {
  constructor(
    @Inject('IPolicyService')
    private readonly policyService: policyServiceInterface.IPolicyService,
  ) {}

  // ===== LeaveConfig =====

  @Get('leave-config')
  @ApiOperation({ summary: 'Lấy tất cả cấu hình nghỉ phép' })
  @ApiResponse({ status: 200, description: 'Danh sách LeaveConfig' })
  async getAllLeaveConfigs(): Promise<LeaveConfig[]> {
    return this.policyService.getAllLeaveConfigs();
  }

  @Get('leave-config/:id')
  @ApiOperation({ summary: 'Lấy cấu hình nghỉ phép theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của LeaveConfig' })
  @ApiResponse({ status: 200, description: 'LeaveConfig tìm thấy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getLeaveConfigById(@Param('id') id: string): Promise<LeaveConfig> {
    return this.policyService.getLeaveConfigById(id);
  }

  @Get('leave-config/contract/:contractType')
  @ApiOperation({ summary: 'Lấy cấu hình nghỉ phép theo loại hợp đồng' })
  @ApiParam({
    name: 'contractType',
    enum: ContractType,
    description: 'Loại hợp đồng',
  })
  @ApiResponse({ status: 200, description: 'LeaveConfig tìm thấy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getLeaveConfigByContractType(
    @Param('contractType') contractType: ContractType,
  ): Promise<LeaveConfig> {
    return this.policyService.getLeaveConfig(contractType);
  }

  @Post('leave-config')
  @ApiOperation({ summary: 'Tạo mới cấu hình nghỉ phép' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'contractType đã tồn tại' })
  async createLeaveConfig(@Body() dto: CreateLeaveConfigDto): Promise<void> {
    const entity = new LeaveConfig(
      randomUUID(),
      dto.contractType,
      dto.baseDaysPerYear,
      dto.bonusDaysPerCycle,
      dto.bonusYearCycle,
      dto.maxDaysPerRequest,
      dto.minimumNoticeDays,
      dto.prorateByMonth,
      dto.joinDateCutoffDay,
      dto.allowNegativeBalance,
      dto.isActive ?? true,
    );
    return this.policyService.createLeaveConfig(entity);
  }

  @Put('leave-config/:id')
  @ApiOperation({ summary: 'Cập nhật cấu hình nghỉ phép' })
  @ApiParam({ name: 'id', description: 'UUID của LeaveConfig' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async updateLeaveConfig(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveConfigDto,
  ): Promise<void> {
    return this.policyService.updateLeaveConfig(id, dto);
  }

  @Delete('leave-config/:id')
  @ApiOperation({ summary: 'Xóa cấu hình nghỉ phép' })
  @ApiParam({ name: 'id', description: 'UUID của LeaveConfig' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async deleteLeaveConfig(@Param('id') id: string): Promise<void> {
    return this.policyService.deleteLeaveConfig(id);
  }

  // ===== OTConfig =====

  @Get('ot-config')
  @ApiOperation({ summary: 'Lấy tất cả cấu hình OT' })
  @ApiResponse({ status: 200, description: 'Danh sách OTConfig' })
  async getAllOTConfigs(): Promise<OTConfig[]> {
    return this.policyService.getAllOTConfigs();
  }

  @Get('ot-config/:id')
  @ApiOperation({ summary: 'Lấy cấu hình OT theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của OTConfig' })
  @ApiResponse({ status: 200, description: 'OTConfig tìm thấy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getOTConfigById(@Param('id') id: string): Promise<OTConfig> {
    return this.policyService.getOTConfigById(id);
  }

  @Get('ot-config/contract/:contractType')
  @ApiOperation({ summary: 'Lấy cấu hình OT theo loại hợp đồng' })
  @ApiParam({
    name: 'contractType',
    enum: ContractType,
    description: 'Loại hợp đồng',
  })
  @ApiResponse({ status: 200, description: 'OTConfig tìm thấy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getOTConfigByContractType(
    @Param('contractType') contractType: ContractType,
  ): Promise<OTConfig | null> {
    return this.policyService.getOTConfig(contractType);
  }

  @Post('ot-config')
  @ApiOperation({ summary: 'Tạo mới cấu hình OT' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'contractType đã tồn tại' })
  async createOTConfig(@Body() dto: CreateOTConfigDto): Promise<void> {
    const entity = new OTConfig(
      randomUUID(),
      dto.contractType,
      dto.maxHoursPerDay,
      dto.maxHoursPerMonth,
      dto.maxHoursPerYear,
      dto.salaryMultiplier,
      dto.isActive ?? true,
    );
    return this.policyService.createOTConfig(entity);
  }

  @Put('ot-config/:id')
  @ApiOperation({ summary: 'Cập nhật cấu hình OT' })
  @ApiParam({ name: 'id', description: 'UUID của OTConfig' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async updateOTConfig(
    @Param('id') id: string,
    @Body() dto: UpdateOTConfigDto,
  ): Promise<void> {
    return this.policyService.updateOTConfig(id, dto);
  }

  @Delete('ot-config/:id')
  @ApiOperation({ summary: 'Xóa cấu hình OT' })
  @ApiParam({ name: 'id', description: 'UUID của OTConfig' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async deleteOTConfig(@Param('id') id: string): Promise<void> {
    return this.policyService.deleteOTConfig(id);
  }

  // ===== PaidPersonalLeaveEvent =====

  @Get('paid-personal-event')
  @ApiOperation({ summary: 'Lấy tất cả sự kiện nghỉ việc riêng có lương' })
  @ApiResponse({ status: 200, description: 'Danh sách PaidPersonalLeaveEvent' })
  async getAllPaidPersonalEvents(): Promise<PaidPersonalLeaveEvent[]> {
    return this.policyService.findAllPaidPersonalEvents();
  }

  @Get('paid-personal-event/:code')
  @ApiOperation({ summary: 'Lấy sự kiện nghỉ việc riêng theo code' })
  @ApiParam({
    name: 'code',
    enum: PaidPersonalEventCode,
    description: 'Mã sự kiện',
  })
  @ApiResponse({ status: 200, description: 'PaidPersonalLeaveEvent tìm thấy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getPaidPersonalEventByCode(
    @Param('code') code: PaidPersonalEventCode,
  ): Promise<PaidPersonalLeaveEvent> {
    return this.policyService.getPaidPersonalEvent(code);
  }

  @Post('paid-personal-event')
  @ApiOperation({ summary: 'Tạo mới sự kiện nghỉ việc riêng' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Code đã tồn tại' })
  async createPaidPersonalEvent(
    @Body() dto: CreatePaidPersonalEventDto,
  ): Promise<void> {
    const entity = new PaidPersonalLeaveEvent(
      randomUUID(),
      dto.code,
      dto.name,
      dto.allowedDays,
      dto.resetOnUse ?? true,
    );
    return this.policyService.createPaidPersonalEvent(entity);
  }

  @Put('paid-personal-event/:id')
  @ApiOperation({ summary: 'Cập nhật sự kiện nghỉ việc riêng' })
  @ApiParam({ name: 'id', description: 'UUID của PaidPersonalLeaveEvent' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async updatePaidPersonalEvent(
    @Param('id') id: string,
    @Body() dto: UpdatePaidPersonalEventDto,
  ): Promise<void> {
    return this.policyService.updatePaidPersonalEvent(id, dto);
  }

  @Delete('paid-personal-event/:id')
  @ApiOperation({ summary: 'Xóa sự kiện nghỉ việc riêng' })
  @ApiParam({ name: 'id', description: 'UUID của PaidPersonalLeaveEvent' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async deletePaidPersonalEvent(@Param('id') id: string): Promise<void> {
    return this.policyService.deletePaidPersonalEvent(id);
  }
}
