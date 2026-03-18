import { BaseVortexCommerceException } from 'src/common/exceptions/base-vortex-commerce-exeception';

export class ProductNameAlreadyExistsException extends BaseVortexCommerceException {
  constructor(message: string, code: number = 409) {
    super(message, code);
  }
}
