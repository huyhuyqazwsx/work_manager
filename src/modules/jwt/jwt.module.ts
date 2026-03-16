import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppJwtService } from './application/services/jwt.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [
    AppJwtService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
    RolesGuard,
    { provide: 'IJwtService', useClass: AppJwtService },
  ],
  exports: ['IJwtService', AccessTokenGuard, RefreshTokenGuard, RolesGuard],
})
export class AppJwtModule {}
