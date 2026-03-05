import { OTTicketModule } from '@modules/ot-ticket/ot-ticket.module';
import { Module } from '@nestjs/common';
import { PolicyModule } from '@modules/policy/policy.module';
import { UserModule } from '@modules/user/user.module';
import { OTPlanController } from '@modules/ot-plan/presentation/controllers/ot-plan.controller';
import { PrismaOTPlanRepository } from '@modules/ot-plan/infrastructure/ot-plan.repository';
import { OTPlanService } from '@modules/ot-plan/application/services/ot-plan.service';

@Module({
  imports: [OTTicketModule, PolicyModule, UserModule],
  controllers: [OTPlanController],
  providers: [
    {
      provide: 'IOTPlanRepository',
      useClass: PrismaOTPlanRepository,
    },
    {
      provide: 'IOTPlanService',
      useClass: OTPlanService,
    },
  ],
  exports: ['IOTPlanService'],
})
export class OTPlanModule {}
