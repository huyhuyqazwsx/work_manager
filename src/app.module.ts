import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/configuration';
import { MailModule } from '@modules/mail/mail.module';
import { CacheModule } from '@infra/cache/cache.module';
import { InviteModule } from '@modules/invite/invite.module';
import { DepartmentModule } from '@modules/department/department.module';
import { LeaveModule } from '@modules/leave/leave.module';
import { HolidayModule } from '@modules/holiday/holiday.module';
import { LeaveTypeModule } from '@modules/leave-type/leave-type.module';
import { PolicyModule } from '@modules/policy/policy.module';
import { StorageModule } from '@infra/storage/storage.module';
import { CompensationModule } from '@modules/compensation/compensation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OTTicketModule } from '@modules/ot-ticket/ot-ticket.module';
import { OTPlanModule } from '@modules/ot-plan/ot-plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    CacheModule,
    PrismaModule,
    AuthModule,
    UserModule,
    MailModule,
    InviteModule,
    DepartmentModule,
    LeaveModule,
    HolidayModule,
    LeaveTypeModule,
    PolicyModule,
    LeaveTypeModule,
    StorageModule,
    CompensationModule,
    OTTicketModule,
    OTPlanModule,
  ],
  providers: [AppService],
})
export class AppModule {}
