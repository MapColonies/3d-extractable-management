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

      if (!payload.username || !payload.password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Username and password are required', code: 'MISSING_CREDENTIALS' });
      }

      const result = this.manager.validateUser(payload);
      const status = result.isValid ? httpStatus.OK : httpStatus.UNAUTHORIZED;

      if (!result.isValid) {
        this.logger.info({ msg: 'Unauthorized user validation attempt', username: payload.username, code: result.code });
      }

      return res.status(status).json(result);
    } catch (error) {
      this.logger.error({ msg: 'Failed to validate user', error });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to validate user', code: 'INTERNAL_ERROR' });
    }
  };
}
