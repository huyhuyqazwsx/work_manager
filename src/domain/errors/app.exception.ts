import { HttpException, HttpStatus } from '@nestjs/common';
import { AppError } from './app-error.enum';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: AppError,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super({ errorCode, message, details }, statusCode);
  }
}
