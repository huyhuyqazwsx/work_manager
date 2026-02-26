import { Controller, Get, Inject } from '@nestjs/common';
import * as leaveTypeServiceInterface from '../../application/interfaces/leave-type.service.interface';
import { LeaveType } from '../../../../domain/entities/leave_type.entity';

@Controller('leave-type')
export class LeaveTypeController {
  constructor(
    @Inject('ILeaveTypeService')
    private readonly leaveTypeService: leaveTypeServiceInterface.ILeaveTypeService,
  ) {}

  @Get()
  async findAll(): Promise<LeaveType[]> {
    return await this.leaveTypeService.findAll();
  }
}
