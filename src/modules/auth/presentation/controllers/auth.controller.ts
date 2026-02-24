import {
  Controller,
  Get,
  Inject,
  Logger,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as authServiceInterface from '../../application/interfaces/auth.service.interface';
import { AuthGuard } from '@nestjs/passport';
import { ZohoUserProfilePayload } from '../../application/dto/zoho.dto';
import { ApiTags } from '@nestjs/swagger';
import express from 'express';
import { ConfigService } from '@nestjs/config';
type ZohoRequest = Request & {
  user?: ZohoUserProfilePayload;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');
  constructor(
    @Inject('IAuthService')
    private readonly authService: authServiceInterface.IAuthService,
    private readonly configService: ConfigService,
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
    const zohoUser = req.user as ZohoUserProfilePayload;

    if (!zohoUser?.email) {
      throw new UnauthorizedException();
    }

    const result = await this.authService.handleZohoLogin(zohoUser);

    // this.logger.log(result.accessToken);
    // this.logger.log(result.refreshToken);

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

    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const redirectUrl = new URL(`${frontendUrl}/auth/handle-status`);

    redirectUrl.searchParams.set('user_status', result.user_status ?? 'NONE');

    if (result.email) {
      redirectUrl.searchParams.set('email', result.email);
    }

    return res.redirect(redirectUrl.toString());
  }
}
