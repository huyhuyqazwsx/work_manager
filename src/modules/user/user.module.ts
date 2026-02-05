import { Module } from '@nestjs/common';
import { UserService } from './application/services/user.service';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/user.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    UserService,
    PrismaUserRepository,
    {
      provide: 'IUserService',
      useClass: UserService,
    },
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
  ],
  exports: ['IUserService'],
})
export class UserModule {}
