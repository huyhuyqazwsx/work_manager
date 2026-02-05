export interface ZohoTokenResponse {
  access_token: string;
  scope: string;
  id_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
}

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
