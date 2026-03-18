// refresh-token.strategy.ts
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@domain/type/jwt.types';
import { UserRole } from '@domain/enum/enum';
import { AppError, AppException } from '@domain/errors';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(RefreshTokenStrategy.name);

  constructor(configService: ConfigService) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: (req: RequestWithCookies): string | null => {
        const fromCookie = req?.cookies?.['refreshToken'];
        const fromHeader = req?.headers?.['x-refresh-token'] as
          | string
          | undefined;

        this.logger.debug('=== RefreshToken Extract ===');
        this.logger.debug(`URL: ${req.method} ${req.originalUrl}`);
        this.logger.debug(`Origin: ${req.headers.origin}`);
        this.logger.debug(`Cookie header raw: ${req.headers.cookie}`);
        this.logger.debug(
          `Parsed refreshToken cookie: ${fromCookie ?? 'NOT FOUND'}`,
        );
        this.logger.debug(
          `x-refresh-token header: ${fromHeader ?? 'NOT FOUND'}`,
        );
        this.logger.debug(
          `Token source: ${fromCookie ? 'COOKIE' : fromHeader ? 'HEADER' : 'NONE'}`,
        );

        return fromCookie ?? fromHeader ?? null;
      },
      secretOrKey:
        configService.get<string>('jwt.refresh.secret') ?? 'fallback',
      ignoreExpiration: false,
      passReqToCallback: true,
    };
    super(options);
  }

  validate(
    req: RequestWithCookies,
    payload: JwtPayload,
  ): { userId: string; role: UserRole; refreshToken: string } {
    this.logger.debug('=== RefreshToken Validate ===');
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

    const refreshToken =
      req.cookies['refreshToken'] ??
      (req.headers['x-refresh-token'] as string | undefined);

    if (!refreshToken) {
      this.logger.warn('FAIL - refreshToken not found in cookie or header');
      throw new AppException(
        AppError.AUTH_INVALID_TOKEN,
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.debug(`OK - userId: ${payload.sub}, role: ${payload.role}`);
    return { userId: payload.sub, role: payload.role, refreshToken };
  }
}
