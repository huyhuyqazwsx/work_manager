import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@domain/type/jwt.types';
import { UserRole } from '@domain/enum/enum';

// Tạo interface cho cookies
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
        return req?.cookies?.['refreshToken'] ?? null;
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
      throw new UnauthorizedException();
    }

    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      role: payload.role,
      refreshToken,
    };
  }
}
