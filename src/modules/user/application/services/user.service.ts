import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUserService } from '../interfaces/user.service.interface';
import { User } from '../../../../entities/user/user.entity';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserService implements IUserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) {}

  async createUserFromOAuth(user: User): Promise<void> {
    this.logger.log(`Creating new user from OAuth`);
    return await this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<User | null> {
    this.logger.log(`Finding user by ID: ${id}`);
    return await this.userRepository.findById(id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user by email: ${email}`);
    return await this.userRepository.findByEmail(email);
  }
}
