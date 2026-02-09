export interface JwtPayload {
  sub: string; // user id
  email?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenInfo {
  token: string;
  expiresIn: string;
}
