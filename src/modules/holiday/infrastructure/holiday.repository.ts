import { Injectable } from '@nestjs/common';
import {
  BasePrismaRepository,
  PrismaDelegate,
} from '@infra/repository/base/base-prisma.repository';
import { Holiday } from '@domain/entities/holiday.entity';
import { Holiday as PrismaHoliday } from '@prisma/client';
import { IHolidayRepository } from '../domain/repositories/holiday.repository.interface';
import { PrismaService } from '@infra/database/prisma/PrismaService';
import { HolidayMapper } from './holiday.mapper';
import { HolidayType } from '@domain/enum/enum';

@Injectable()
export class PrismaHolidayRepository
  extends BasePrismaRepository<Holiday, PrismaHoliday>
  implements IHolidayRepository
{
  constructor(prisma: PrismaService) {
    super(
      prisma,
      prisma.holiday as unknown as PrismaDelegate<PrismaHoliday>,
      HolidayMapper,
    );
  }
  async findByYear(year: number): Promise<Holiday[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const raws = await this.prismaModel.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return raws.map((r) => HolidayMapper.toDomain(r));
  }

  async findByMonth(year: number, month: number): Promise<Holiday[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const raws = await this.prismaModel.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return raws.map((r) => HolidayMapper.toDomain(r));
  }

  async findByType(type: HolidayType): Promise<Holiday[]> {
    const raws = await this.prismaModel.findMany({
      where: {
        type: type,
      },
    });
    return raws.map((r) => HolidayMapper.toDomain(r));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Holiday[]> {
    const raws = await this.prismaModel.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    return raws.map((r) => HolidayMapper.toDomain(r));
  }

  async findRecurring(): Promise<Holiday[]> {
    const raws = await this.prismaModel.findMany({
      where: {
        isRecurring: true,
      },
      orderBy: { date: 'asc' },
    });
    return raws.map((r) => HolidayMapper.toDomain(r));
  }

  async findUpcoming(limit: number = 10): Promise<Holiday[]> {
    const start = new Date();
    const raws = await this.prismaModel.findMany({
      where: {
        date: {
          gte: start,
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
    return raws.map((r) => HolidayMapper.toDomain(r));
  }

  async existsByDate(date: Date): Promise<boolean> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const count = await this.prismaModel.count({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });
    return count > 0;
  }

  async isHoliday(date: Date): Promise<boolean> {
    return this.existsByDate(date);
  }

  async findByDate(date: Date): Promise<Holiday | null> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const raws = await this.prismaModel.findFirst({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    return raws ? HolidayMapper.toDomain(raws) : null;
  }

  async findCompensatoryNearDate(
    originalId: string,
    targetDate: Date,
  ): Promise<Holiday | null> {
    const start = new Date(targetDate);
    start.setDate(start.getDate() - 2);

    const end = new Date(targetDate);
    end.setDate(end.getDate() + 2);

    const raw = await this.prismaModel.findFirst({
      where: {
        isCompensatory: true,
        originalHolidayId: originalId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return raw ? HolidayMapper.toDomain(raw) : null;
  }
}
