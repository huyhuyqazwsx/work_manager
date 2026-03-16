import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IJwtService } from '../interfaces/jwt.service.inteface';
import * as cacheRepositoryInterface from '../../../../domain/cache/cache.repository.interface';
import { JwtPayload, TokenPair } from '@domain/type/jwt.types';
import { StringValue } from 'ms';
import { UserRole } from '@domain/enum/enum';

@Injectable()
export class AppJwtService implements IJwtService {
  private readonly refreshTTL: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('ICacheRepository')
    private readonly cacheRepository: cacheRepositoryInterface.ICacheRepository,
  ) {
    this.refreshTTL = this.configService.get<number>('redis.ttl.refreshToken')!;
  }

  async generateTokenPair(userId: string, role: UserRole): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, role };

    const accessExpiresIn =
      this.configService.get<string>('jwt.access.expiresIn') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refresh.expiresIn') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.access.secret'),
        expiresIn: accessExpiresIn as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refresh.secret'),
        expiresIn: refreshExpiresIn as StringValue,
      }),
    ]);

    await this.cacheRepository.set(
      `refresh:${userId}`,
      refreshToken,
      this.refreshTTL,
    );

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    userId: string,
    role: UserRole,
    oldRefreshToken: string,
  ): Promise<TokenPair> {
    const isValid = await this.validateRefreshToken(userId, oldRefreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.cacheRepository.delete(`refresh:${userId}`);
    return this.generateTokenPair(userId, role);
  }

  async logout(userId: string): Promise<void> {
    await this.cacheRepository.delete(`refresh:${userId}`);
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const stored = await this.cacheRepository.get<string>(`refresh:${userId}`);
    return stored === refreshToken;
  }
}
