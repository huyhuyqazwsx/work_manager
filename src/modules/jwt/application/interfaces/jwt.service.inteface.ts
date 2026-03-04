import { TokenPair } from '@domain/type/jwt.types';

export interface IJwtService {
  generateTokenPair(userId: string, role: string): Promise<TokenPair>;
  refreshTokens(
    userId: string,
    role: string,
    oldRefreshToken: string,
  ): Promise<TokenPair>;
  logout(userId: string): Promise<void>;
  validateRefreshToken(userId: string, refreshToken: string): Promise<boolean>;
}
