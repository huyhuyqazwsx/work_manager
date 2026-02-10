import {
  Controller,
  Get,
  Inject,
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
type ZohoRequest = Request & {
  user?: ZohoUserProfilePayload;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // private readonly logger = new Logger('AuthController');
  constructor(
    @Inject('IAuthService')
    private readonly authService: authServiceInterface.IAuthService,
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

    if (result.accessToken) {
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    }
    const redirectUrl = new URL('https://localhost:5173/auth/handle-status');

    redirectUrl.searchParams.set('user_status', result.user_status ?? 'NONE');

    if (result.email) {
      redirectUrl.searchParams.set('email', result.email);
    }

    return res.redirect(redirectUrl.toString());
  }
}
