import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import * as compensationServiceInterface from '../../application/interfaces/compensation.service.interface';
import { randomUUID } from 'node:crypto';
import { CreateCompensationDto } from '../../application/dto/create-compensation.dto';
import { UpdateCompensationDto } from '../../application/dto/update-compensation.dto';

@ApiTags('Compensation')
@Controller('compensation')
export class CompensationController {
  constructor(
    @Inject('ICompensationService')
    private readonly compensationService: compensationServiceInterface.ICompensationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all compensation balances' })
  async findAll(): Promise<CompensationBalance[]> {
    return this.compensationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get compensation by id' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CompensationBalance | null> {
    return this.compensationService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create compensation balance' })
  @ApiResponse({ status: 201 })
  async create(dto: CreateCompensationDto): Promise<void> {
    const balance = new CompensationBalance(
      randomUUID(),
      dto.userId,
      dto.hours,
    );

    await this.compensationService.create(balance);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update compensation balance' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCompensationDto,
  ): Promise<void> {
    const balance = await this.compensationService.findById(id);
    if (!balance) throw new NotFoundException();

    if (dto.hours !== undefined) {
      balance.setHours(dto.hours);
    }

    await this.compensationService.update(id, {
      hours: balance.getBalance(),
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete compensation balance' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.compensationService.delete(id);
  }
}
