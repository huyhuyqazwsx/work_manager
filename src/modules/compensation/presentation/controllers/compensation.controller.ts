import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as compensationServiceInterface from '@modules/compensation/application/interfaces/compensation.service.interface';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';

@ApiTags('Compensation')
@Controller('compensation')
export class CompensationController {
  constructor(
    @Inject('ICompensationService')
    private readonly compensationService: compensationServiceInterface.ICompensationService,
  ) {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Xem số dư quỹ nghỉ bù' })
  async getBalance(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<CompensationBalance> {
    return this.compensationService.getBalanceByUserId(userId);
  }
}
