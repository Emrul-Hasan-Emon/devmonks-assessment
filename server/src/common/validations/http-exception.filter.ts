import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isArray } from 'class-validator';
import { Response } from 'express';
import {
  CannotCreateEntityIdMapError,
  EntityNotFoundError,
  EntityPropertyNotFoundError,
  QueryFailedError,
} from 'typeorm';

export interface HttpExceptionResponse {
  statusCode: number;
  error: string;
  message?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let responseBody: HttpExceptionResponse = {
      statusCode: 0,
      error: '',
      message: '',
    };
    
    try {
      if (exception instanceof HttpException) {
        const exceptionData =
          typeof exception.getResponse() === 'string'
            ? exception.getResponse()
            : Object.assign({}, exception.getResponse());
        if (typeof exceptionData == 'string') {
          responseBody = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: exceptionData,
            error: 'Bad Request',
          };
        } else {
          responseBody = {
            statusCode: exception.getStatus(),
            message: isArray(exceptionData['message'])
              ? exceptionData['message'][0]
              : exceptionData['message'] ||
                (isArray(exceptionData['validationErrors']) ? exceptionData['validationErrors'][0] : undefined) ||
                exceptionData,
            error:
              exceptionData['error'] ||
              exceptionData['message'] ||
              exceptionData,
          };
        }
      } else if (exception instanceof QueryFailedError) {
        if (exception.driverError.code === 'ER_DUP_ENTRY') {
          const errorMessage = exception.message;
          const match = errorMessage.match(/'(.*?)'/);
          const value = match ? match[0] : 'Duplicate';
          responseBody = {
            statusCode: HttpStatus.CONFLICT,
            message: `${value} already exists!`,
            error: 'Duplicate field value error',
          };
        } else {
          responseBody = {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: exception.message,
            error: 'Unprocessable Entity',
          };
        }
      } else if (
        exception instanceof UnprocessableEntityException ||
        exception instanceof EntityNotFoundError ||
        exception instanceof CannotCreateEntityIdMapError ||
        exception instanceof EntityPropertyNotFoundError
      ) {
        responseBody = {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: exception.message,
          error: 'Unprocessable Entity',
        };
      } else {
        responseBody = {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception['message'] || 'Type Error occurred',
          error: 'Internal Server Error',
        };
      }
      response
        .status(responseBody.statusCode)
        .json({ success: false, ...responseBody });
    } catch (err) {
      console.log('exception_error_log=============', err);
    }
  }
}
