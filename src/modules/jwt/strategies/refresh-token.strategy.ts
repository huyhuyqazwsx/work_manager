// refresh-token.strategy.ts
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { HttpStatus, Injectable } from '@nestjs/common';
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
  constructor(configService: ConfigService) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: (req: RequestWithCookies): string | null => {
        if (req?.cookies?.['refreshToken']) {
          return req.cookies['refreshToken'];
        }
        const header = req?.headers?.['x-refresh-token'] as string | undefined;
        return header ?? null;
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
    if (!payload.sub || !payload.role) {
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
      throw new AppException(
        AppError.AUTH_INVALID_TOKEN,
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      userId: payload.sub,
      role: payload.role,
      refreshToken,
    };
  }
}
