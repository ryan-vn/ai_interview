import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || res.error || 'Bad request';
        
        // 处理验证错误，将验证信息放入 errors 字段
        if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 统一错误响应格式
    const errorResponse = {
      code: status,
      message,
      data: null,
      errors,
      timestamp: Date.now(),
    };

    // 记录错误日志（生产环境建议使用专业的日志库）
    console.error(`[${new Date().toISOString()}] Error:`, {
      status,
      message,
      errors,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }
}

