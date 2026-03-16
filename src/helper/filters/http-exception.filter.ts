import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppError, AppException } from '@domain/errors';

import { Request, Response } from 'express';

interface ValidationError {
  field: string;
  errors: string[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // AppException (lỗi có error code)
    if (exception instanceof AppException) {
      return response.status(statusCode).json({
        success: false,
        errorCode: exception.errorCode,
        message: exception.message,
        details: exception.details ?? null,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // ValidationPipe error (class validation)
    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray((exceptionResponse as Record<string, unknown>)['message'])
    ) {
      const rawErrors = (exceptionResponse as Record<string, unknown>)[
        'message'
      ] as string[];

      const details: ValidationError[] = rawErrors.map((err) => {
        const [field, ...rest] = err.split(' ');
        return { field, errors: [rest.join(' ')] };
      });

      return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        errorCode: AppError.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // HttpException thông thường (NotFoundException, BadRequestException...)
    const errorCodeMap: Partial<Record<number, AppError>> = {
      [HttpStatus.NOT_FOUND]: AppError.NOT_FOUND,
      [HttpStatus.FORBIDDEN]: AppError.AUTH_FORBIDDEN,
      [HttpStatus.UNAUTHORIZED]: AppError.AUTH_UNAUTHORIZED,
      [HttpStatus.BAD_REQUEST]: AppError.BAD_REQUEST,
      [HttpStatus.INTERNAL_SERVER_ERROR]: AppError.INTERNAL_ERROR,
      [HttpStatus.PAYLOAD_TOO_LARGE]: AppError.PAYLOAD_TOO_LARGE,
    };

    const msg =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? String((exceptionResponse as Record<string, unknown>)['message'])
          : 'An error occurred';

    return response.status(statusCode).json({
      success: false,
      errorCode: errorCodeMap[statusCode] ?? AppError.INTERNAL_ERROR,
      message: msg,
      details: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
