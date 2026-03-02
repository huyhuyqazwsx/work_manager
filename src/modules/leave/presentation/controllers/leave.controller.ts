import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import * as leaveServiceInterface from '../../application/interfaces/leave.service.interface';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeaveEligibilityResponseDto } from '../../application/dto/leave-eligibility-response.dto';
import { CreateLeaveRequestDto } from '../../application/dto/create-leave-request.dto';

@Controller('leave')
export class LeaveController {
  constructor(
    @Inject('ILeaveService')
    private readonly leaveService: leaveServiceInterface.ILeaveService,
  ) {}

  @Get()
  async findAll(): Promise<LeaveRequest[]> {
    return await this.leaveService.findAll();
  }

  @Get('eligibility/:userId')
  @ApiOperation({ summary: 'Get leave eligibility of user' })
  async getLeaveEligibility(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<LeaveEligibilityResponseDto[]> {
    return this.leaveService.getLeaveEligibility(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create leave request' })
  @ApiResponse({
    status: 201,
    description: 'Leave request created successfully',
    type: LeaveRequest,
  })
  async create(@Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.leaveService.createLeaveRequest(dto);
  }
}
