import { User } from '../../../../../entities/user/user.entity';
import { Injectable } from '@nestjs/common';
import { UserMapper } from './user.mapper';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PrismaService } from '../../../../../infrastructure/database/prisma/PrismaService';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findAll(): Promise<User[]> {
    const rawUsers = await this.prisma.user.findMany();
    return rawUsers.map((raw) => UserMapper.toDomain(raw));
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.create({ data });
  }

  async update(id: string, user: Partial<User>): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: UserMapper.toPersistence(user as User),
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
