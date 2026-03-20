import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as compensationServiceInterface from '@modules/compensation/application/interfaces/compensation.service.interface';
import { CompensationBalance } from '@domain/entities/compensation_balance.entity';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';
import { RolesGuard } from '@modules/jwt/guards/roles.guard';

@ApiTags('Compensation')
@UseGuards(AccessTokenGuard, RolesGuard)
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
    return this.compensationService.getBalanceByUserId(
      userId,
      new Date().getFullYear(),
    );
  }
}
