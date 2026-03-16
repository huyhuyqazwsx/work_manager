import { UserRole } from '@domain/enum/enum';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
