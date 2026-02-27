import { Module } from '@nestjs/common';
import { PolicyService } from './application/services/policy.service';
import { PrismaPolicyRepository } from './infrastructure/policy.repository';

@Module({
  providers: [
    {
      provide: 'IPolicyService',
      useClass: PolicyService,
    },
    {
      provide: 'IPolicyRepository',
      useClass: PrismaPolicyRepository,
    },
  ],
  exports: ['IPolicyService'],
})
export class PolicyModule {}
