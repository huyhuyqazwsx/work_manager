import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { InviteService } from './application/services/InviteService';
import { InviteController } from './presentation/controllers/invite.controller';

@Module({
  imports: [UserModule],
  controllers: [InviteController],
  providers: [
    InviteService,
    {
      provide: 'IInviteService',
      useClass: InviteService,
    },
  ],
  exports: ['IInviteService'],
})
export class InviteModule {}
