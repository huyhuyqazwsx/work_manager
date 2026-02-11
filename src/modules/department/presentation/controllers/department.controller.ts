import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import { DepartmentService } from '../../application/services/department.service';
import { Department } from '../../../../domain/entities/department.entity';
import { CreateDepartmentDto } from '../../application/dto/create-department.dto';
import { randomUUID } from 'node:crypto';

@Controller('department')
export class DepartmentController {
  constructor(
    @Inject('IDepartmentService') private departmentService: DepartmentService,
  ) {}

  @Post()
  async create(@Body() dto: CreateDepartmentDto): Promise<void> {
    try {
      const department = new Department(
        randomUUID(),
        dto.name,
        dto.code,
        dto.managerId ?? '',
        dto.isActive ?? true,
      );
      await this.departmentService.create(department);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
