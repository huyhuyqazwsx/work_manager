import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../../../domain/type/jwt.types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request): string | null => {
        if (req?.cookies?.accessToken) {
          return req.cookies.accessToken as string;
        }

        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        return token ?? null;
      },
      secretOrKey: configService.get<string>('jwt.access.secret') ?? 'fallback',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): { userId: string; role: string } {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, role: payload.role };
  }
}
