import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import * as authServiceInterface from '../../application/interfaces/auth.service.interface';
import { AuthGuard } from '@nestjs/passport';
import { ZohoUserProfilePayload } from '../../application/dto/zoho.dto';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenGuard } from '@modules/jwt/guards/refresh-token.guard';
import { CurrentUser } from '@modules/jwt/decorators/current-user.decorator';
import { UserRole } from '@domain/enum/enum';
import * as jwtServiceInterface from '@modules/jwt/application/interfaces/jwt.service.inteface';
import * as requestTypes from '@domain/type/request.types';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';

interface ZohoRequest extends express.Request {
  user?: ZohoUserProfilePayload;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // private readonly logger = new Logger('AuthController');

  constructor(
    @Inject('IAuthService')
    private readonly authService: authServiceInterface.IAuthService,
    private readonly configService: ConfigService,
    @Inject('IJwtService')
    private readonly jwtService: jwtServiceInterface.IJwtService,
  ) {}

  @Get('zoho')
  @UseGuards(AuthGuard('zoho'))
  async zohoLogin(): Promise<void> {}

  @Get('zoho/callback')
  @UseGuards(AuthGuard('zoho'))
  async zohoCallback(
    @Req() req: ZohoRequest,
    @Res() res: express.Response,
  ): Promise<void> {
    const zohoUser = req.user;

    if (!zohoUser?.email) {
      throw new UnauthorizedException();
    }

    const result = await this.authService.handleZohoLogin(zohoUser);

    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const redirectUrl = new URL(`${frontendUrl}/auth/handle-status`);

    redirectUrl.searchParams.set('user_status', result.user_status ?? 'NONE');

    if (result.email) {
      redirectUrl.searchParams.set('email', result.email);
    }

    // ← thêm token vào URL
    if (result.accessToken) {
      redirectUrl.searchParams.set('accessToken', result.accessToken);
    }
    if (result.refreshToken) {
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
    }

    return res.redirect(redirectUrl.toString());
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @CurrentUser()
    user: { userId: string; role: UserRole; refreshToken: string },
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<void> {
    const result = await this.jwtService.refreshTokens(
      user.userId,
      user.role,
      user.refreshToken,
    );

    res.cookie('accessToken', result.accessToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'none' as const,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
    });
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  async logout(
    @CurrentUser() user: requestTypes.RequestUser,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<void> {
    await this.jwtService.logout(user.userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
}
