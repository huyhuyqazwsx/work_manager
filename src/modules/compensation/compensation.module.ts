import { Module } from '@nestjs/common';
import { CompensationService } from './application/services/compensation.service';
import { CompensationController } from './presentation/controllers/compensation.controller';
import { PrismaCompensationRepository } from './infrastructure/compensation.repository';

@Module({
  providers: [
    {
      provide: 'ICompensationService',
      useClass: CompensationService,
    },
    {
      provide: 'ICompensationRepository',
      useClass: PrismaCompensationRepository,
    },
  ],
  controllers: [CompensationController],
  exports: ['ICompensationService'],
})
export class CompensationModule {}
