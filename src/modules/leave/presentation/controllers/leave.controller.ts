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
  UploadedFile,
  FileTypeValidator,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import * as leaveServiceInterface from '../../application/interfaces/leave.service.interface';
import { LeaveRequest } from '@domain/entities/leave_request.entity';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLeaveRequestDto } from '../../application/dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from '../../application/dto/reject-leave-request.dto';
import { PaginatedLeaveRequests } from '@modules/leave/application/dto/paginated-leave-requests.dto';
import { PreviewLeaveResponseDto } from '@modules/leave/application/dto/preview-leave-response.dto';
import { PreviewLeaveRequestDto } from '@modules/leave/application/dto/preview-leave-request.dto';
import { NotifyEmailResponse } from '@modules/leave/application/dto/notify_email_response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnnualLeaveDashboardDto } from '@modules/leave/application/dto/leave-dashboard.dto';
import { RangeExistDto } from '@modules/leave/application/dto/range-exist.dto';

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

  @Get('me/:userId')
  async getMyLeaveRequests(
    @Param('userId', ParseUUIDPipe) userId: string,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedLeaveRequests> {
    return this.leaveService.getMyLeaveRequests(userId, page, limit);
  }

  @Get('dashboard/annual/:userId')
  @ApiOperation({ summary: 'Get annual leave dashboard of user' })
  @ApiResponse({ status: 200, type: AnnualLeaveDashboardDto })
  async getAnnualLeaveDashboard(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AnnualLeaveDashboardDto> {
    return this.leaveService.getAnnualLeaveDashboard(userId);
  }

  @Get('notify/:userId')
  @ApiOperation({ summary: 'Get notify email receivers for leave workflow' })
  @ApiResponse({
    status: 200,
    description: 'List of email receivers',
    type: NotifyEmailResponse,
  })
  async getNotifyInfo(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<NotifyEmailResponse> {
    return this.leaveService.getNotifyInfo(userId);
  }

  @Get('bod/:bodId')
  @ApiOperation({ summary: 'Get leave requests for BOD approval' })
  @ApiParam({
    name: 'bodId',
    type: String,
    description: 'BOD user ID',
  })
  getLeaveRequestByBod(@Param('bodId') bodId: string): Promise<LeaveRequest[]> {
    return this.leaveService.getLeaveRequestByBod(bodId);
  }

  @Get('range/:userId')
  async getRangeExistLeaveRequest(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<RangeExistDto> {
    return this.leaveService.getRangeExistLeaveRequest(userId, year);
  }

  @Get(':userId')
  async getById(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<LeaveRequest | null> {
    return this.leaveService.findById(userId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        userId: { type: 'string', example: 'uuid-user-id' },
        leaveTypeCode: { type: 'string', example: 'ANNUAL_LEAVE' },
        fromDate: { type: 'string', example: '2026-03-10' },
        toDate: { type: 'string', example: '2026-03-12' },
        fromSession: { type: 'string', example: 'MORNING' },
        toSession: { type: 'string', example: 'AFTERNOON' },
        reason: { type: 'string', example: 'Personal work' },
        paidPersonalEventCode: { type: 'string', example: 'CHILD_MARRIAGE' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() dto: CreateLeaveRequestDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(pdf|jpg|png)$/i,
          }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.leaveService.createLeaveRequest(dto, file);
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
