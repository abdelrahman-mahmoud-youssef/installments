import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toResponseBody(exception);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(body.statusCode).json(body);
  }

  private toResponseBody(exception: unknown): ErrorResponseBody {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong. Please try again.',
      error: 'Internal Server Error',
    };
  }

  private fromHttpException(exception: HttpException): ErrorResponseBody {
    const status = exception.getStatus();
    const nestResponse = exception.getResponse();
    if (typeof nestResponse === 'object' && nestResponse !== null) {
      return { statusCode: status, error: exception.name, ...nestResponse } as ErrorResponseBody;
    }
    return { statusCode: status, message: String(nestResponse), error: exception.name };
  }

  private fromPrismaError(exception: Prisma.PrismaClientKnownRequestError): ErrorResponseBody {
    if (exception.code === 'P2002') {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'A record with this value already exists.',
        error: 'Conflict',
      };
    }
    if (exception.code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'The requested record was not found.',
        error: 'Not Found',
      };
    }
    if (exception.code === 'P2003') {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'This record cannot be deleted because other records depend on it.',
        error: 'Conflict',
      };
    }
    this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong. Please try again.',
      error: 'Internal Server Error',
    };
  }
}
