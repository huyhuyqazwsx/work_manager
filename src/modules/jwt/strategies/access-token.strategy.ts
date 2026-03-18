// access-token.strategy.ts
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '@domain/type/jwt.types';
import { AppError, AppException } from '@domain/errors';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  private readonly logger = new Logger(AccessTokenStrategy.name);

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request): string | null => {
        const fromCookie = req?.cookies?.accessToken as string | undefined;
        const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

        this.logger.debug('=== AccessToken Extract ===');
        this.logger.debug(`URL: ${req.method} ${req.originalUrl}`);
        this.logger.debug(`Origin: ${req.headers.origin}`);
        this.logger.debug(`Cookie header raw: ${req.headers.cookie}`);
        this.logger.debug(
          `Parsed accessToken cookie: ${fromCookie ?? 'NOT FOUND'}`,
        );
        this.logger.debug(
          `Authorization header: ${req.headers.authorization ?? 'NOT FOUND'}`,
        );
        this.logger.debug(
          `Token source: ${fromCookie ? 'COOKIE' : fromHeader ? 'HEADER' : 'NONE'}`,
        );

        return fromCookie ?? fromHeader ?? null;
      },
      secretOrKey: configService.get<string>('jwt.access.secret') ?? 'fallback',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): { userId: string; role: string } {
    this.logger.debug('=== AccessToken Validate ===');
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    if (!payload.sub || !payload.role) {
      this.logger.warn(
        `FAIL - missing sub="${payload.sub}" role="${payload.role}"`,
      );
      throw new AppException(
        AppError.AUTH_UNAUTHORIZED,
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.debug(`OK - userId: ${payload.sub}, role: ${payload.role}`);
    return { userId: payload.sub, role: payload.role };
  }
}
