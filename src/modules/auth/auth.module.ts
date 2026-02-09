import { Module } from '@nestjs/common';
import { AuthService } from './application/services/auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { ZohoOauthStrategy } from './infrastructure/strategies/zoho-oauth.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'zoho' }), UserModule],
  controllers: [AuthController],
  providers: [
    ZohoOauthStrategy,
    {
      provide: 'IAuthService',
      useClass: AuthService,
    },
  ],
  exports: ['IAuthService'],
})
export class AuthModule {}
