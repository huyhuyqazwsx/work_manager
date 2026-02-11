import { Module } from '@nestjs/common';
import { UserService } from './application/services/user.service';
import { PrismaUserRepository } from './infrastructure/Repository/user.repository';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  controllers: [UserController],
  providers: [
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
