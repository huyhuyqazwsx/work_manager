import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import * as leaveServiceInterface from '../../application/interfaces/leave.service.interface';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaveEligibilityResponseDto } from '../../application/dto/leave-eligibility-response.dto';
import { CreateLeaveRequestDto } from '../../application/dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from '../../application/dto/reject-leave-request.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { PreviewLeaveResponseDto } from '@modules/leave/application/dto/preview-leave-response.dto';
import { PreviewLeaveRequestDto } from '@modules/leave/application/dto/preview-leave-request.dto';

@ApiTags('Leave')
@Controller('leave')
export class LeaveController {
  constructor(
    @Inject('ILeaveService')
    private readonly leaveService: leaveServiceInterface.ILeaveService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all leave requests' })
  async findAll(): Promise<LeaveRequest[]> {
    return this.leaveService.findAll();
  }

  @Get('eligibility/:userId')
  @ApiOperation({ summary: 'Get leave eligibility of user' })
  async getLeaveEligibility(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<LeaveEligibilityResponseDto[]> {
    return this.leaveService.getLeaveEligibility(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get leave requests by user' })
  async findByUserId(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<LeaveRequest[]> {
    return this.leaveService.findByUserId(userId);
  }

  @Get('manager/:managerId')
  async getByManager(
    @Param('managerId', ParseUUIDPipe) managerId: string,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedLeaveRequests> {
    return this.leaveService.getLeaveRequestByManagerId(managerId, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Submit leave request' })
  @ApiResponse({
    status: 201,
    description: 'Leave request submitted successfully',
    type: LeaveRequest,
  })
  async create(@Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.leaveService.createLeaveRequest(dto);
  }

  @Post('preview')
  async previewLeaveRequest(
    @Body() dto: PreviewLeaveRequestDto,
  ): Promise<PreviewLeaveResponseDto> {
    return this.leaveService.previewLeaveRequest(dto);
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
      dto.reason ?? undefined,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel approved leave request (before start date)',
  })
  async cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<LeaveRequest> {
    return this.leaveService.cancelLeaveRequest(id, userId);
  }
}
