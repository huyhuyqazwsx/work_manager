import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUserService } from '../interfaces/user.service.interface';
import { UserAuth } from '../../../../domain/entities/userAuth.entity';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import * as cacheRepositoryInterface from '../../../../domain/cache/cache.repository.interface';
import * as mailServiceInterface from '../../../mail/application/interfaces/mail.service.interface';
import { UserRole, UserStatus } from '../../../../domain/enum/enum';
import { InviteForm } from '../../../../domain/type/invite.types';

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
  async createPendingUserAndSendInvite(
    email: string,
    role: UserRole = UserRole.EMPLOYEE,
    hireDate?: string,
    departmentCode?: string,
  ): Promise<void> {
    let hireDateObj = new Date();

    if (hireDate) {
      // "16/2/2026" → [16, 2, 2026]
      const parts = hireDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // month - 1 vì JavaScript Date dùng 0-11 cho tháng
      hireDateObj = new Date(year, month - 1, day);
    }

    const user = new UserAuth(
      randomUUID(),
      email,
      'null', // fullName
      'null', // gender
      UserStatus.PENDING,
      role,
      hireDateObj,
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

  async inviteUsersFromExcel(
    invites: InviteForm[],
  ): Promise<InviteUsersResult> {
    const result: InviteUsersResult = {
      PENDING: [],
      ACTIVE: [],
      INACTIVE: [],
    };

    for (const invite of invites) {
      const user = await this.userRepository.findByEmail(invite.email);

      if (!user) {
        await this.createPendingUserAndSendInvite(
          invite.email,
          invite.role,
          invite.hireDate,
          invite.departmentCode,
        );
        result.PENDING.push(invite.email);
        continue;
      }

      if (user.isPending()) {
        await this.resendInvite(invite.email);
        result.PENDING.push(invite.email);
        continue;
      }

      if (user.isActive()) {
        result.ACTIVE.push(invite.email);
        continue;
      }

      if (user.isInactive()) {
        result.INACTIVE.push(invite.email);
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
