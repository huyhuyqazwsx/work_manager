import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import * as leaveTypeServiceInterface from '../../application/interfaces/leave-type.service.interface';
import { LeaveType } from '../../../../domain/entities/leave_type.entity';
import { CreateLeaveTypeDto } from '../../application/dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../../application/dto/update-leave-type.dto';

@Controller('leave-type')
export class LeaveTypeController {
  constructor(
    @Inject('ILeaveTypeService')
    private readonly leaveTypeService: leaveTypeServiceInterface.ILeaveTypeService,
  ) {}

  @Get()
  async findAll(): Promise<LeaveType[]> {
    return this.leaveTypeService.findAll();
  }

  @Get('active')
  async findAllActive(): Promise<LeaveType[]> {
    return this.leaveTypeService.findAllActive();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LeaveType | null> {
    return this.leaveTypeService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.leaveTypeService.createLeaveType(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    return this.leaveTypeService.updateLeaveType(id, dto);
  }
}
