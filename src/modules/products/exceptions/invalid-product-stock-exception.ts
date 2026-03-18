import { BaseVortexCommerceException } from 'src/common/exceptions/base-vortex-commerce-exeception';

export class InvalidProductStockException extends BaseVortexCommerceException {
  constructor(message: string, code: number = 400) {
    super(message, code);
  }
}
