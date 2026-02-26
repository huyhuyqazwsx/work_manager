import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import * as leaveServiceInterface from '../../application/interfaces/leave.service.interface';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';

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
}
