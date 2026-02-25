import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '../../../infrastructure/repository/base/base-prisma.repository';
import { Holiday } from '../../../domain/entities/holiday.entity';
import { Holiday as PrismaHoliday } from '@prisma/client';
import { IHolidayRepository } from '../domain/repositories/holiday.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/PrismaService';
import { HolidayMapper } from './holiday.mapper';

@Injectable()
export class PrismaHolidayRepository
  extends BasePrismaRepository<Holiday, PrismaHoliday>
  implements IHolidayRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma.holiday as unknown as PrismaDelegate<PrismaHoliday>,
      HolidayMapper,
    );
  }
}
