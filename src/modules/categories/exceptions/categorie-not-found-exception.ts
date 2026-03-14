import { BaseVortexCommerceException } from 'src/common/exceptions/base-vortex-commerce-exeception';

export class CategoryNotFoundException extends BaseVortexCommerceException {
  constructor(message: string, code: number = 404) {
    super(message, code);
  }
}
