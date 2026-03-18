import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { IUserService } from '../interfaces/user.service.interface';
import { UserAuth } from '@domain/entities/userAuth.entity';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { InviteUsersResult } from '../dto/invite-user-result.dto';
import { randomBytes, randomUUID } from 'node:crypto';
import * as cacheRepositoryInterface from '@domain/cache/cache.repository.interface';
import * as mailServiceInterface from '../../../mail/application/interfaces/mail.service.interface';
import { EmailType, UserRole, UserStatus } from '@domain/enum/enum';
import { InviteForm } from '@domain/type/invite.types';
import * as departmentServiceInterface from '../../../department/application/interfaces/department.service.interface';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { UserResponseDto } from '@modules/user/application/dto/user-response.dto';
import * as departmentRepositoryInterface from '@modules/department/domain/repositories/department.repository.interface';
import { PrismaTransactionClient } from '@domain/type/prisma-transaction.type';
import { UserInDepartmentDto } from '@modules/user/application/dto/user-in-department.dto';
import { AppError, AppException } from '@domain/errors';

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
    @Inject('IDepartmentRepository')
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
    @Inject('IMailService')
    private readonly mailService: mailServiceInterface.IMailService,
    @Inject('IDepartmentService')
    private readonly departmentService: departmentServiceInterface.IDepartmentService,
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
    // const key = `user:id:${id}`;
    // let cached = await this.cache.get<UserAuth>(key);
    // if (cached) return UserAuth.fromPlain(cached);

    const cached = await this.userRepository.findById(id);

    // if (cached) await this.cache.set(key, cached, 60 * 60);
    return cached;
  }

  async findUserByEmail(email: string): Promise<UserAuth | null> {
    // this.logger.log(`Finding user by email: ${email}`);
    // const key = `user:email:${email}`;
    // let cached = await this.cache.get<UserAuth>(key);
    // if (cached) return UserAuth.fromPlain(cached);

    const cached = await this.userRepository.findByEmail(email);
    // if (cached) await this.cache.set(key, cached, 60 * 60);
    return cached;
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    this.logger.log('Finding all users');

    const key = 'users:all';
    const cached = await this.cache.get<UserResponseDto[]>(key);
    if (cached) return cached;

    const users = await this.userRepository.findAll();
    const departments = await this.departmentService.findAll();

    const departmentMap = new Map(departments.map((d) => [d.id, d.code]));

    const result = users.map((user) => ({
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

    await this.cache.set(key, result, 60 * 60);
    return result;
  }

  async createUser(user: UserAuth): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new AppException(
        AppError.USER_ALREADY_EXISTS,
        `User with email ${user.email} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    await this.userRepository.save(user);
  }

  async updateUser(id: string, user: Partial<UserAuth>): Promise<void> {
    await this.findUserById(id);

    if (user.email) {
      const existingUser = await this.userRepository.findByEmail(user.email);
      if (existingUser && existingUser.id !== id) {
        throw new AppException(
          AppError.USER_ALREADY_EXISTS,
          `Email ${user.email} is already taken`,
          HttpStatus.CONFLICT,
        );
      }
    }

    await this.userRepository.update(id, user);
    await this.cache.delete(`user:id:${id}`);
    await this.cache.delete('users:all');
    if (user.email) {
      await this.cache.delete(`user:email:${user.email}`);
    }
  }

  async deleteUser(id: string): Promise<void> {
    await this.findUserById(id);

    await this.userRepository.delete(id);
    await this.cache.delete(`user:id:${id}`);
    await this.cache.delete('users:all');
  }

  //Gửi xác thực cho email
  async createPendingUsersAndInvite(
    users: UserAuth[],
    emails: string[],
  ): Promise<void> {
    await this.runInTransaction(async (tx: PrismaTransactionClient) => {
      if (users.length) {
        await this.createMany(users, tx);
      }

      await this.mailService.createMany(
        emails.map((email) => {
          const verificationToken = randomBytes(32).toString('hex');

          return new EmailQueue(randomUUID(), email, [], EmailType.INVITE, {
            verificationToken,
          });
        }),
        tx,
      );
    });
  }

  async resendInvite(email: string) {
    const verificationToken = randomBytes(32).toString('hex');
    this.logger.log(`Verification token: ${verificationToken}`);

    const emailQueue = new EmailQueue(
      randomUUID(),
      email,
      [],
      EmailType.INVITE,
      {
        verificationToken,
      },
    );
    await this.mailService.create(emailQueue);
  }

  async inviteUsersFromExcel(
    invites: InviteForm[],
  ): Promise<InviteUsersResult> {
    const result: InviteUsersResult = { PENDING: [], ACTIVE: [], INACTIVE: [] };

    const allEmails = invites.map((i) => i.email);
    const allDepartmentNames = [...new Set(invites.map((i) => i.department))];

    const [accountBuckets, deptBuckets] = await Promise.all([
      this.userRepository.classifyAccounts(allEmails),
      this.departmentRepository.classifyDepartments(allDepartmentNames),
    ]);

    if (deptBuckets.notFound.length > 0) {
      throw new AppException(
        AppError.NOT_FOUND,
        `Departments not found: ${deptBuckets.notFound.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // ACTIVE / INACTIVE không cần xử lý thêm
    result.ACTIVE.push(...accountBuckets.active);
    result.INACTIVE.push(...accountBuckets.inactive);

    // Emails cần invite: notFound (tạo mới) + pendingInSystem (resend)
    const emailsToInvite: string[] = [];
    const newUsers: UserAuth[] = [];

    const maxCode = await this.userRepository.findMaxCode();
    let codeIndex = maxCode ? parseInt(maxCode.replace('SG', ''), 10) + 1 : 1;

    for (const invite of invites) {
      const isNew = accountBuckets.notFound.includes(invite.email);
      const isPending = accountBuckets.pendingInSystem.includes(invite.email);

      if (!isNew && !isPending) continue;

      emailsToInvite.push(invite.email);
      result.PENDING.push(invite.email);

      if (isNew) {
        const deptId = deptBuckets.found[invite.department];
        const code = invite.employeeCode?.trim() || `SG${codeIndex++}`;

        newUsers.push(
          new UserAuth(
            randomUUID(),
            code,
            invite.email,
            '',
            '',
            UserStatus.PENDING,
            invite.role,
            deptId,
            invite.department,
            invite.position ?? '',
            invite.contractType,
            invite.joinDate ?? null,
            invite.contractSignedDate ?? null,
          ),
        );
      }
    }

    if (emailsToInvite.length > 0) {
      await this.createPendingUsersAndInvite(newUsers, emailsToInvite);
    }

    return result;
  }

  //Xác thực
  async verifyEmail(email: string, token: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppException(
        AppError.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.isActive()) {
      return;
    }

    if (user.isInactive()) {
      throw new AppException(
        AppError.AUTH_FORBIDDEN,
        'User is inactive',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!user.isPending()) {
      throw new AppException(
        AppError.BAD_REQUEST,
        'User not found status',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cacheKey = `verification:${email}`;
    const cachedToken = await this.cache.get<string>(cacheKey);

    if (!cachedToken) {
      throw new AppException(
        AppError.AUTH_INVALID_TOKEN,
        'Verification token expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (cachedToken !== token) {
      throw new AppException(
        AppError.AUTH_INVALID_TOKEN,
        'Invalid verification token',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userRepository.update(user.id, {
      status: UserStatus.ACTIVE,
    });

    await this.cache.delete(cacheKey);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppException(
        AppError.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async getCountCode(offset: number = 0): Promise<string> {
    const maxCode = await this.userRepository.findMaxCode();
    const maxNumber = maxCode ? parseInt(maxCode.replace('SG', ''), 10) : 0;
    return `SG${maxNumber + 1 + offset}`;
  }

  async getUsersByUserOfDepartment(
    managerId: string,
  ): Promise<UserInDepartmentDto[]> {
    const manager = await this.departmentRepository.findByManagerId(managerId);

    if (!manager) {
      throw new AppException(
        AppError.DEPARTMENT_NOT_FOUND,
        'Department not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.userRepository.getUsersByUserOfDepartment(managerId);
  }
}
