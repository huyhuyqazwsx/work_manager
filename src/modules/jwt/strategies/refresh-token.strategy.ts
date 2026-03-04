import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '@domain/type/jwt.types';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        configService.get<string>('jwt.refresh.secret') ?? 'fallback',
      ignoreExpiration: false,
      passReqToCallback: true,
    };
    super(options);
  }

  validate(
    req: Request,
    payload: JwtPayload,
  ): { userId: string; role: string; refreshToken: string } {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader?.split(' ')[1];
    if (!refreshToken) throw new UnauthorizedException();
    return { userId: payload.sub, role: payload.role, refreshToken };
  }
}
