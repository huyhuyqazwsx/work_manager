import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
} from '@nestjs/common';
import * as leaveServiceInterface from '../../application/interfaces/leave.service.interface';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeaveEligibilityResponseDto } from '../../application/dto/leave-eligibility-response.dto';
import { CreateLeaveRequestDto } from '../../application/dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from '../../application/dto/reject-leave-request.dto';

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
  @ApiOperation({ summary: 'Create leave request as draft' })
  @ApiResponse({
    status: 201,
    description: 'Leave request created successfully',
    type: LeaveRequest,
  })
  async create(@Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.leaveService.createLeaveRequest(dto);
  }

  @Patch(':id/draft')
  @ApiOperation({ summary: 'Update draft leave request' })
  async updateDraft(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    return this.leaveService.updateLeaveRequest(id, dto, false);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit draft leave request' })
  async submit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    return this.leaveService.updateLeaveRequest(id, dto, true);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve leave request' })
  async approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('approverId', new ParseUUIDPipe()) approverId: string,
  ): Promise<LeaveRequest> {
    return this.leaveService.approveLeaveRequest(id, approverId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject leave request' })
  async reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectLeaveRequestDto,
  ): Promise<LeaveRequest> {
    return this.leaveService.rejectLeaveRequest(
      id,
      dto.approverId,
      dto.reason ?? null,
    );
  }
}
