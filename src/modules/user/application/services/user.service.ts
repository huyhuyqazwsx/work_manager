import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUserService } from '../interfaces/user.service.interface';
import { UserAuth } from '@domain/entities/userAuth.entity';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import * as cacheRepositoryInterface from '@domain/cache/cache.repository.interface';
import * as mailServiceInterface from '../../../mail/application/interfaces/mail.service.interface';
import { EmailType, UserRole, UserStatus } from '@domain/enum/enum';
import { InviteForm } from '@domain/type/invite.types';
import * as departmentServiceInterface from '../../../department/application/interfaces/department.service.interface';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { UserResponseDto } from '@modules/user/application/dto/user-response.dto';

@Injectable()
export class UserService
  extends BaseCrudService<UserAuth>
  implements IUserService
{
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    @Inject('ICacheRepository')
    private readonly cache: cacheRepositoryInterface.ICacheRepository,
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
    @Inject('IDepartmentService')
    private readonly departmentService: departmentServiceInterface.IDepartmentService,
    private readonly configService: ConfigService,
  ) {
    super(userRepository);
  }

  findUsersByRole(role: UserRole): Promise<UserAuth[]> {
    return this.userRepository.findByRole(role);
  }

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

  async findAllUsers(): Promise<UserResponseDto[]> {
    this.logger.log('Finding all users');

    const users = await this.userRepository.findAll();
    const departments = await this.departmentService.findAll();

    const departmentMap = new Map(departments.map((d) => [d.id, d.code]));

    return users.map((user) => ({
      id: user.id,
      code: user.code,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      role: user.role,
      departmentCode: departmentMap.get(user.departmentId) ?? '',
      contractType: user.contractType,
      joinDate: user.joinDate,
      contractSignedDate: user.contractSignedDate,
    }));
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
  async createPendingUsersAndInvite(
    users: UserAuth[],
    emails: string[],
  ): Promise<void> {
    await this.runInTransaction(async (tx) => {
      if (users.length) {
        await this.createMany(users, tx);
      }

      await this.mailService.createMany(
        emails.map((email) => {
          const token = randomBytes(32).toString('hex');

          return new EmailQueue(randomUUID(), email, EmailType.INVITE, {
            token,
          });
        }),
        tx,
      );
    });
  }

  async resendInvite(email: string) {
    const verificationToken = randomBytes(32).toString('hex');
    this.logger.log(`Verification token: ${verificationToken}`);

    const emailQueue = new EmailQueue(randomUUID(), email, EmailType.INVITE, {
      verificationToken,
    });
    await this.mailService.create(emailQueue);
  }

  async inviteUsersFromExcel(
    invites: InviteForm[],
  ): Promise<InviteUsersResult> {
    const result: InviteUsersResult = { PENDING: [], ACTIVE: [], INACTIVE: [] };
    const users: UserAuth[] = [];
    const emails: string[] = [];

    const maxCode = await this.userRepository.findMaxCode();
    // this.logger.debug(maxCode);
    let codeIndex = maxCode ? parseInt(maxCode.replace('SG', ''), 10) + 1 : 1;

    for (const invite of invites) {
      const user = await this.userRepository.findByEmail(invite.email);

      if (!user) {
        const department = await this.departmentService.findByName(
          invite.department,
        );
        if (!department) throw new Error('Department not found');

        let code = invite.employeeCode?.trim();

        if (!code) {
          code = `SG${codeIndex}`;

          while (await this.userRepository.findByCode(code)) {
            codeIndex++;
            code = `SG${codeIndex}`;
          }

          codeIndex++;
        }

        users.push(
          new UserAuth(
            randomUUID(),
            code,
            invite.email,
            '',
            '',
            UserStatus.PENDING,
            invite.role,
            department.id,
            invite.position ?? '',
            invite.contractType,
            invite.joinDate,
            invite.contractSignedDate ?? null,
          ),
        );

        emails.push(invite.email);
        result.PENDING.push(invite.email);
        continue;
      }

      if (user.isPending()) {
        emails.push(invite.email);
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

    if (emails.length > 0) {
      await this.createPendingUsersAndInvite(users, emails);
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

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getCountCode(offset: number = 0): Promise<string> {
    const maxCode = await this.userRepository.findMaxCode();
    const maxNumber = maxCode ? parseInt(maxCode.replace('SG', ''), 10) : 0;
    return `SG${maxNumber + 1 + offset}`;
  }
}
