import { BaseVortexCommerceException } from 'src/common/exceptions/base-vortex-commerce-exeception';

export class CategoryNameAlreadyExistsException extends BaseVortexCommerceException {
  constructor(message: string, code: number = 409) {
    super(message, code);
  }
}
