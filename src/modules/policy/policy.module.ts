import { Module } from '@nestjs/common';
import { PolicyService } from './application/services/policy.service';
import { PolicyController } from './presentation/controllers/policy.controller';

@Module({
  providers: [PolicyService],
  controllers: [PolicyController],
})
export class PolicyModule {}
