import { Module } from '@nestjs/common';
import { PolicyService } from './application/services/policy.service';
import { PrismaPolicyRepository } from './infrastructure/repositories/policy.repository';
import { PrismaPaidPersonalLeaveEventRepository } from './infrastructure/repositories/paid-personal-leave-event.repository';
import { PrismaLeaveConfigRepository } from './infrastructure/repositories/leave-config.repository';
import { PrismaOTConfigRepository } from './infrastructure/repositories/ot-config.repository';
import { PolicyController } from './presentation/controllers/policy.controller';

@Module({
  providers: [
    PrismaLeaveConfigRepository,
    PrismaOTConfigRepository,
    PrismaPaidPersonalLeaveEventRepository,
    {
      provide: 'IPolicyService',
      useClass: PolicyService,
    },
    {
      provide: 'IPolicyRepository',
      useClass: PrismaPolicyRepository,
    },
  ],
  controllers: [PolicyController],
  exports: ['IPolicyService'],
})
export class PolicyModule {}
