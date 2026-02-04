import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { ValidationsManager } from '@src/validations/models/validationsManager';

@injectable()
export class UsersController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ValidationsManager) private readonly manager: ValidationsManager
  ) {}

  public validateUser: TypedRequestHandlers['POST /users/validate'] = (req, res) => {
    try {
      const payload = req.body;
      const result = this.manager.validateUser(payload);

      let status: number;

      if (!result.isValid) {
        switch (result.code) {
          case 'MISSING_CREDENTIALS':
            status = httpStatus.BAD_REQUEST;
            break;
          case 'INVALID_CREDENTIALS':
            status = httpStatus.UNAUTHORIZED;
            break;
          default:
            status = httpStatus.INTERNAL_SERVER_ERROR;
            this.logger.error({ msg: 'Unexpected validation code', code: result.code });
            break;
        }
        return res.status(status).json(result);
      }

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      this.logger.error({ msg: 'Failed to validate user', error });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ isValid: false, message: 'Failed to validate user', code: 'INTERNAL_ERROR' });
    }
  };
}
