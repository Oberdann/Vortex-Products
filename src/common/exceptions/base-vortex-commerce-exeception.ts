import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseVortexCommerceException extends HttpException {
  constructor(
    message: string = 'BaseVortexCommerceException error',
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, statusCode);
  }
}
