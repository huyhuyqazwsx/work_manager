import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express'; // thêm Request
import { AppError } from '@domain/errors';

export class FileSizeException extends Error {
  constructor(public readonly message: string) {
    super(message);
  }
}

@Catch(FileSizeException)
export class FileSizeExceptionFilter implements ExceptionFilter {
  catch(exception: FileSizeException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      success: false,
      errorCode: AppError.PAYLOAD_TOO_LARGE,
      message: exception.message,
      details: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
