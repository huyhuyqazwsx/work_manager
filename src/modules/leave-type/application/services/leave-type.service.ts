import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { LeaveType } from '@domain/entities/leave_type.entity';
import * as leaveTypeServiceInterface from '../interfaces/leave-type.service.interface';
import * as leaveTypeRepositoryInterface from '../../domain/repositories/leave-type.repository.interface';
import { randomUUID } from 'node:crypto';
import { LeaveTypeCode } from '@domain/enum/enum';

@Injectable()
export class LeaveTypeService
  extends BaseCrudService<LeaveType>
  implements leaveTypeServiceInterface.ILeaveTypeService
{
  constructor(
    @Inject('ILeaveTypeRepository')
    private readonly leaveTypeRepository: leaveTypeRepositoryInterface.ILeaveTypeRepository,
  ) {
    super(leaveTypeRepository);
  }

  async findByCode(code: string): Promise<LeaveType | null> {
    return this.leaveTypeRepository.findByCode(code);
  }

  async findAllActive(): Promise<LeaveType[]> {
    return this.leaveTypeRepository.findAllActive();
  }

  async createLeaveType(dto: {
    code: string;
    name: string;
    isPaid?: boolean;
    deductCompensation?: boolean;
  }): Promise<LeaveType> {
    // Check duplicate code
    const existing = await this.leaveTypeRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Leave type with code "${dto.code}" already exists`,
      );
    }

    const leaveType = new LeaveType(
      randomUUID(),
      dto.code as LeaveTypeCode,
      dto.name,
      dto.isPaid ?? false,
      dto.deductCompensation ?? false,
    );

    await this.leaveTypeRepository.save(leaveType);

    return leaveType;
  }

  async updateLeaveType(
    id: string,
    dto: {
      name?: string;
      isPaid?: boolean;
      deductCompensation?: boolean;
    },
  ): Promise<LeaveType> {
    const leaveType = await this.leaveTypeRepository.findById(id);
    if (!leaveType) {
      throw new NotFoundException(`Leave type ${id} not found`);
    }

    if (dto.name) leaveType.updateName(dto.name);
    if (dto.isPaid !== undefined) leaveType.setPaid(dto.isPaid);
    if (dto.deductCompensation !== undefined)
      leaveType.setDeductCompensation(dto.deductCompensation);

    await this.leaveTypeRepository.update(id, leaveType);

    return leaveType;
  }
}
