import { JwtPayload, TokenPair } from '../../../../domain/type/jwt.types';

export interface IJwtService {
  sign(payload: JwtPayload, expiresIn?: string): string;

  verify(token: string): JwtPayload;

  decode(token: string): JwtPayload | null;

  generateAccessToken(userId: string, email: string): string;

  generateRefreshToken(userId: string, email: string): string;

  generateTokenPair(userId: string, email: string): TokenPair;
}
