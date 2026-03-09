import { UserStatus } from '@domain/enum/enum';

export interface ZohoIdTokenPayload {
  at_hash: string;
  sub: string;
  aud: string;
  email_verified: boolean;
  gender: string;
  azp: string;
  iss: string;
  name: string;
  exp: number;
  iat: number;
  first_name: string;
  email: string;
}

export interface ZohoUserProfilePayload {
  email_verified: boolean;
  gender: string;
  name: string;
  first_name: string;
  email: string;
}

export interface ResponseHandleZoho {
  user_status: UserStatus | null;
  email: string | null;
  accessToken?: string;
  refreshToken?: string;
}
