import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DepartmentService } from '../../application/services/department.service';
import { Department } from '@domain/entities/department.entity';
import { CreateDepartmentDto } from '../../application/dto/create-department.dto';
import { randomUUID } from 'node:crypto';
import { UpdateDepartmentDto } from '../../application/dto/update-department.dto';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';
import { RolesGuard } from '@modules/jwt/guards/roles.guard';

@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('department')
export class DepartmentController {
  constructor(
    @Inject('IDepartmentService') private departmentService: DepartmentService,
  ) {}

  @Post()
  async create(@Body() dto: CreateDepartmentDto): Promise<void> {
    const department = new Department(
      randomUUID(),
      dto.name,
      dto.code,
      dto.managerId ?? null,
      dto.isActive ?? true,
    );
    await this.departmentService.create(department);
  }

  @Get()
  async findAll(): Promise<Department[]> {
    return await this.departmentService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Department> {
    return this.departmentService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<void> {
    await this.departmentService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.departmentService.delete(id);
  }
}
