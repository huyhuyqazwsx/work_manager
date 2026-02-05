import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
  ZohoUserProfilePayload,
  ZohoIdTokenPayload,
} from '../../application/dto/zoho.dto';

type OAuth2Callback = (
  err: Error | null,
  accessToken?: string,
  refreshToken?: string,
  result?: Record<string, unknown>,
) => void;

type GetOAuthAccessTokenFn = (
  code: string,
  params: Record<string, unknown>,
  callback: OAuth2Callback,
) => void;

interface OAuth2Client {
  getOAuthAccessToken: GetOAuthAccessTokenFn;
}

interface InternalProfile {
  email: string;
  email_verified: boolean;
  firstName: string;
  name: string;
  gender: string;
}

@Injectable()
export class ZohoOauthStrategy extends PassportStrategy(Strategy, 'zoho') {
  private readonly logger = new Logger(ZohoOauthStrategy.name);
  private _idToken: string | null = null;
  private _isConfigured = false;

  constructor(configService: ConfigService) {
    const accountsDomain =
      configService.get<string>('zoho.accountsDomain') || 'accounts.zoho.com';
    const clientId = configService.get<string>('zoho.clientID');
    const clientSecret = configService.get<string>('zoho.clientSecret');
    const callbackUrl = configService.get<string>('zoho.callbackURL');

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error('Missing Zoho OAuth configuration');
    }

    super({
      authorizationURL: `https://${accountsDomain}/oauth/v2/auth`,
      tokenURL: `https://${accountsDomain}/oauth/v2/token`,
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,
      scope: ['email', 'profile', 'openid'],
      passReqToCallback: false,
    });

    this.logger.log('ZohoOauthStrategy initialized');

    this.configureOAuth2Client();
  }

  private configureOAuth2Client(): void {
    if (this._isConfigured) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const oauth2 = (this as unknown as { _oauth2: OAuth2Client })._oauth2;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalGetOAuthAccessToken: GetOAuthAccessTokenFn =
      oauth2.getOAuthAccessToken.bind(oauth2);

    oauth2.getOAuthAccessToken = function (
      code: string,
      params: Record<string, unknown>,
      callback: OAuth2Callback,
    ): void {
      self.logger.log('Exchanging authorization code for tokens...');

      originalGetOAuthAccessToken(
        code,
        params,
        (
          err: Error | null,
          accessToken?: string,
          refreshToken?: string,
          result?: Record<string, unknown>,
        ) => {
          if (err) {
            self.logger.error('Token exchange failed:', err);
            return callback(err);
          }

          self.logger.log('Token exchange successful');
          self.logger.debug(
            `Access Token: ${accessToken ? 'present' : 'missing'}`,
          );
          self.logger.debug(
            `Refresh Token: ${refreshToken ? 'present' : 'missing'}`,
          );
          self.logger.debug(
            `Result keys: ${result ? Object.keys(result).join(', ') : 'none'}`,
          );

          if (result?.id_token && typeof result.id_token === 'string') {
            self._idToken = result.id_token;
            self.logger.log('id_token captured and stored');
          } else {
            self.logger.warn('No id_token in response!');
          }

          callback(null, accessToken, refreshToken, result);
        },
      );
    };

    this._isConfigured = true;
    this.logger.log('OAuth2 client configured');
  }

  userProfile(
    accessToken: string,
    done: (err?: Error | null, profile?: InternalProfile) => void,
  ): void {
    this.logger.log('=== userProfile called ===');
    this.logger.debug(
      `Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : 'missing'}`,
    );
    this.logger.debug(
      `Stored id_token: ${this._idToken ? 'present' : 'missing'}`,
    );

    if (!this._idToken) {
      this.logger.error('✗ Missing id_token - cannot build profile');
      return done(new Error('Missing id_token'));
    }

    try {
      const decoded = jwt.decode(this._idToken);

      if (!decoded || typeof decoded !== 'object') {
        this.logger.error('Failed to decode id_token');
        return done(new Error('Invalid id_token'));
      }

      this.logger.log('id_token decoded successfully');
      this.logger.debug(`Decoded payload: ${JSON.stringify(decoded, null, 2)}`);

      const typedDecoded = decoded as ZohoIdTokenPayload;

      const profile: InternalProfile = {
        email: typedDecoded.email,
        email_verified: typedDecoded.email_verified,
        firstName: typedDecoded.first_name,
        name: typedDecoded.name,
        gender: typedDecoded.gender,
      };

      this.logger.log(`✓ Profile created for: ${profile.email}`);

      done(null, profile);
    } catch (error) {
      this.logger.error('✗ Error in userProfile:', error);
      done(error as Error);
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: InternalProfile,
    done: (error: Error | null, user?: ZohoUserProfilePayload) => void,
  ): void {
    this.logger.log('=== validate called ===');
    this.logger.debug(`Profile received: ${JSON.stringify(profile, null, 2)}`);

    try {
      const user: ZohoUserProfilePayload = {
        email: profile.email,
        email_verified: profile.email_verified,
        first_name: profile.firstName,
        name: profile.name,
        gender: profile.gender,
      };

      this.logger.log(`✓ User validated: ${user.email}`);
      this.logger.debug(`Final user object: ${JSON.stringify(user, null, 2)}`);

      done(null, user);
    } catch (error) {
      this.logger.error('✗ Validation failed:', error);
      done(error as Error);
    }
  }
}
