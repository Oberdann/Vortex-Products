import { BaseVortexCommerceException } from 'src/common/exceptions/base-vortex-commerce-exeception';

export class InvalidProductPriceException extends BaseVortexCommerceException {
  constructor(message: string, code: number = 400) {
    super(message, code);
  }
}
