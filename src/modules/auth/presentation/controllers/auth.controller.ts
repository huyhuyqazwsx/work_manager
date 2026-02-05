import {
  Controller,
  Get,
  Inject,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as authServiceInterface from '../../application/interfaces/auth.service.interface';
import { AuthGuard } from '@nestjs/passport';
import { ZohoUserProfilePayload } from '../../application/dto/zoho.dto';
import { ApiTags } from '@nestjs/swagger';

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
  async zohoCallback(@Req() req: ZohoRequest): Promise<{ status: string }> {
    const zohoUser = req.user as ZohoUserProfilePayload;

    if (!zohoUser?.email) {
      throw new UnauthorizedException();
    }

    await this.authService.handleZohoLogin(zohoUser);

    return { status: 'OK' };
  }
}
