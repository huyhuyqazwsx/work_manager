import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAuthService } from '../interfaces/auth.service.interface';
import { ResponseHandleZoho, ZohoUserProfilePayload } from '../dto/zoho.dto';
import { UserAuth } from '../../../../domain/entities/user/userAuth.entity';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
  ) {}

  async handleZohoLogin(
    zohoUser: ZohoUserProfilePayload,
  ): Promise<ResponseHandleZoho> {
    this.logger.log(`Processing Zoho login for: ${zohoUser.email}`);
    const user = await this.userService.findUserByEmail(zohoUser.email);

    if (!user) {
      return { user_status: null };
    } else {
      if (user.isActive()) {
        const update = this.buildOAuthProfileUpdate(user, zohoUser);

        if (update) {
          await this.userService.updateUser(user.id, update);
        }

        return {
          user_status: user.status,
          accessToken: '',
        };
      }
    }

    return {
      user_status: user.status,
    };
  }

  private buildOAuthProfileUpdate(
    user: UserAuth,
    zoho: ZohoUserProfilePayload,
  ): Partial<UserAuth> | null {
    const update: Partial<UserAuth> = {};

    if (zoho.gender && zoho.gender !== user.gender) {
      update.gender = zoho.gender;
    }

    return Object.keys(update).length > 0 ? update : null;
  }
}
