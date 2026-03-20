import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import * as leaveTypeServiceInterface from '../../application/interfaces/leave-type.service.interface';
import { LeaveType } from '@domain/entities/leave_type.entity';
import { CreateLeaveTypeDto } from '../../application/dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../../application/dto/update-leave-type.dto';
import { RolesGuard } from '@modules/jwt/guards/roles.guard';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';

@UseGuards(AccessTokenGuard, RolesGuard)
@ApiTags('Leave Type')
@Controller('leave-type')
export class LeaveTypeController {
  constructor(
    @Inject('ILeaveTypeService')
    private readonly leaveTypeService: leaveTypeServiceInterface.ILeaveTypeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all leave types' })
  @ApiResponse({
    status: 200,
    description: 'List of leave types',
    type: LeaveType,
    isArray: true,
  })
  async findAll(): Promise<LeaveType[]> {
    return this.leaveTypeService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active leave types' })
  @ApiResponse({
    status: 200,
    description: 'List of active leave types',
    type: LeaveType,
    isArray: true,
  })
  async findAllActive(): Promise<LeaveType[]> {
    return this.leaveTypeService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave type by id' })
  @ApiParam({
    name: 'id',
    description: 'Leave type ID',
    example: 'uuid-value',
  })
  @ApiResponse({
    status: 200,
    description: 'Leave type found',
    type: LeaveType,
  })
  async findById(@Param('id') id: string): Promise<LeaveType | null> {
    return this.leaveTypeService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new leave type' })
  @ApiBody({ type: CreateLeaveTypeDto })
  @ApiResponse({
    status: 201,
    description: 'Leave type created successfully',
    type: LeaveType,
  })
  async create(@Body() dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.leaveTypeService.createLeaveType(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update leave type' })
  @ApiParam({
    name: 'id',
    description: 'Leave type ID',
    example: 'uuid-value',
  })
  @ApiBody({ type: UpdateLeaveTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Leave type updated successfully',
    type: LeaveType,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    return this.leaveTypeService.updateLeaveType(id, dto);
  }
}
