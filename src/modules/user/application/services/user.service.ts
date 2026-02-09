import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUserService } from '../interfaces/user.service.interface';
import { UserAuth } from '../../../../domain/entities/user/userAuth.entity';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { randomBytes, randomUUID } from 'node:crypto';
import { UserStatus } from '../../domain/enum/user-status.enum';
import { ConfigService } from '@nestjs/config';
import * as cacheRepositoryInterface from '../../../../domain/cache/cache.repository.interface';
import * as mailServiceInterface from '../../../mail/application/interfaces/mail.service.interface';
import { UserRole } from '../../domain/enum/user-role.enum';

@Injectable()
export class UserService implements IUserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    @Inject('ICacheRepository')
    private readonly cache: cacheRepositoryInterface.ICacheRepository,
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
    private readonly configService: ConfigService,
  ) {}

  async createUserFromOAuth(user: UserAuth): Promise<void> {
    this.logger.log(`Creating new user from OAuth`);
    return await this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<UserAuth | null> {
    this.logger.log(`Finding user by ID: ${id}`);
    return await this.userRepository.findById(id);
  }

  async findUserByEmail(email: string): Promise<UserAuth | null> {
    this.logger.log(`Finding user by email: ${email}`);
    return await this.userRepository.findByEmail(email);
  }

  async findAllUsers(): Promise<UserAuth[]> {
    this.logger.log('Finding all users');
    return await this.userRepository.findAll();
  }

  async createUser(user: UserAuth): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new Error(`User with email ${user.email} already exists`);
    }

    await this.userRepository.save(user);
  }

  async updateUser(id: string, user: Partial<UserAuth>): Promise<void> {
    await this.findUserById(id);

    if (user.email) {
      const existingUser = await this.userRepository.findByEmail(user.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error(`Email ${user.email} is already taken`);
      }
    }

    await this.userRepository.update(id, user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.findUserById(id);

    await this.userRepository.delete(id);
  }

  //Gửi xác thực cho email
  async createPendingUserAndSendInvite(email: string) {
    const user = new UserAuth(
      randomUUID(),
      email,
      '',
      UserStatus.PENDING,
      UserRole.EMPLOYEE,
    );

    await this.userRepository.save(user);

    await this.resendInvite(email);
  }

  async resendInvite(email: string) {
    const verificationToken = randomBytes(32).toString('hex');
    this.logger.log(`Verification token: ${verificationToken}`);

    const ttl = this.configService.get<number>('redis.ttl.verification')!;

    await this.cache.set(`verification:${email}`, verificationToken, ttl);

    await this.mailService.sendVerificationEmail(email, verificationToken);
  }

  async inviteUsers(emails: string[]): Promise<InviteUsersResult> {
    const result: InviteUsersResult = {
      PENDING: [],
      ACTIVE: [],
      INACTIVE: [],
    };

    for (const email of emails) {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        await this.createPendingUserAndSendInvite(email);
        result.PENDING.push(email);
        continue;
      }

      if (user.isPending()) {
        await this.resendInvite(email);
        result.PENDING.push(email);
        continue;
      }

      if (user.isActive()) {
        result.ACTIVE.push(email);
        continue;
      }

      if (user.isInactive()) {
        result.INACTIVE.push(email);
      }
    }

    return result;
  }

  //Xác thực
  async verifyEmail(email: string, token: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive()) {
      return;
    }

    if (user.isInactive()) {
      throw new ForbiddenException('User is inactive');
    }

    if (!user.isPending()) {
      throw new BadRequestException('User not found status');
    }

    const cacheKey = `verification:${email}`;
    const cachedToken = await this.cache.get<string>(cacheKey);

    if (!cachedToken) {
      throw new BadRequestException('Verification token expired');
    }

    if (cachedToken !== token) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.userRepository.update(user.id, {
      status: UserStatus.ACTIVE,
    });

    await this.cache.delete(cacheKey);
  }
}
