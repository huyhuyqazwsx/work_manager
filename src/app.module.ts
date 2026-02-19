import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { MailModule } from './modules/mail/mail.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { InviteModule } from './modules/invite/invite.module';
import { DepartmentModule } from './modules/department/department.module';
import { LeaveModule } from './modules/leave/leave.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule,
    PrismaModule,
    AuthModule,
    UserModule,
    MailModule,
    InviteModule,
    DepartmentModule,
    LeaveModule,
  ],
  providers: [AppService],
})
export class AppModule {}
