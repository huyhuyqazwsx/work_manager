import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAuthService } from '../interfaces/auth.service.interface';
import { ZohoUserProfilePayload } from '../dto/zoho.dto';
import { User } from '../../../../entities/user/user.entity';
import { randomBytes, randomUUID } from 'node:crypto';
import { UserStatus } from '../../domain/enum/user-status.enum';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';
import * as mailServiceInterface from '../../../mail/application/interfaces/mail.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
  ) {}

  async handleZohoLogin(zohoUser: ZohoUserProfilePayload): Promise<User> {
    this.logger.log(`Processing Zoho login for: ${zohoUser.email}`);
    let user = await this.userService.findUserByEmail(zohoUser.email);

    if (!user) {
      this.logger.log('Creating new user from Zoho id_token...');
      user = await this.createUserFromZoho(zohoUser);
    } else {
      this.logger.log('User exists, proceeding...');
      this.logger.log(user.isPending());
      this.logger.log(user.status);
      if (user.isPending()) {
        const verificationToken = randomBytes(32).toString('hex');
        this.logger.log(`Verification token: ${verificationToken}`);

        await this.mailService.sendVerificationEmail(
          zohoUser.email,
          verificationToken,
        );

        //Lưu token
      }
    }
    return user;
  }

  private async createUserFromZoho(
    zohoUser: ZohoUserProfilePayload,
  ): Promise<User> {
    const user = new User(
      randomUUID(),
      zohoUser.email,
      zohoUser.gender,
      UserStatus.PENDING,
    );

    await this.userService.createUserFromOAuth(user);
    return user;
  }
}
