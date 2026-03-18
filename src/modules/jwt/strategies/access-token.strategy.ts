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
        const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (fromHeader) return fromHeader;
        const fromCookie = req?.cookies?.accessToken as string | undefined;
        return fromCookie ?? null;
      },
      secretOrKey: configService.get<string>('jwt.access.secret') ?? 'fallback',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): { userId: string; role: string } {
    if (!payload.sub || !payload.role) {
      throw new AppException(
        AppError.AUTH_UNAUTHORIZED,
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return { userId: payload.sub, role: payload.role };
  }
}
