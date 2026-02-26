import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../../../infrastructure/crudservice/base-crud.service';
import { LeaveRequest } from '../../../../domain/entities/leave_request.entity';
import { ILeaveService } from '../interfaces/leave.service.interface';
import * as leaveRepositoryInterface from '../../domain/repositories/leave.repository.interface';
import * as holidayServiceInterface from '../../../holiday/application/interfaces/holiday.service.interface';
import { LeaveRequestStatus } from '../../../../domain/enum/enum';
import { randomUUID } from 'node:crypto';
import { LeaveEligibilityResponseDto } from '../dto/leave-eligibility-response.dto';

@Injectable()
export class LeaveService
  extends BaseCrudService<LeaveRequest>
  implements ILeaveService
{
  constructor(
    @Inject('ILeaveRequestRepository')
    private readonly leaveRepository: leaveRepositoryInterface.ILeaveRequestRepository,
    @Inject('IHolidayService')
    private holidayService: holidayServiceInterface.IHolidayService,
  ) {
    super(leaveRepository);
  }
  getLeaveEligibility(
    userId: string,
    leaveTypeId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LeaveEligibilityResponseDto> {
    throw new Error('Method not implemented.');
  }

  async findByUserId(userId: string): Promise<LeaveRequest[]> {
    return await this.leaveRepository.getByUserId(userId);
  }

  async createLeaveRequest(
    userId: string,
    leaveTypeId: string,
    fromDate: Date,
    toDate: Date,
    reason?: string,
  ): Promise<LeaveRequest> {
    if (fromDate > toDate) {
      throw new Error('Invalid date range');
    }

    const { actualLeaveDays } = await this.holidayService.calculateLeaveDays(
      fromDate,
      toDate,
    );

    if (actualLeaveDays <= 0) {
      throw new Error('No valid leave days');
    }

    //TODO handle leave type

    //Create leave request
    let leaveRequest = new LeaveRequest(
      randomUUID(),
      leaveTypeId,
      LeaveRequestStatus.PENDING,
      fromDate,
      toDate,
      actualLeaveDays,
      reason ?? null,
      userId,
      null,
    );

    leaveRequest = await this.handleLeaveRequest(leaveRequest);

    return leaveRequest;
  }

  async handleLeaveRequest(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    //TODO handle send email
    await new Promise((resolve) => setTimeout(resolve, 300));

    return leaveRequest;
  }
}
