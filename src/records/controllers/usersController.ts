import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { RecordsManager } from '../models/recordsManager';

@injectable()
export class UsersController {
  private readonly requestsCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(RecordsManager) private readonly manager: RecordsManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.requestsCounter = new Counter({
      name: 'users_requests_total',
      help: 'Total number of requests to users endpoints',
      labelNames: ['status'],
      registers: [this.metricsRegistry],
    });
  }

  public validateUser: TypedRequestHandlers['POST /users/validate'] = (req, res) => {
    try {
      const payload = req.body;

      if (!payload.username || !payload.password) {
        this.requestsCounter.inc({ status: '400' });
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Username and password are required', code: 'MISSING_CREDENTIALS' });
      }

      const result = this.manager.validate('CREATE', payload);
      const status = result.isValid ? httpStatus.OK : httpStatus.UNAUTHORIZED;

      this.requestsCounter.inc({ status: String(status) });
      return res.status(status).json(result);
    } catch (error) {
      this.logger.error({ msg: 'Failed to validate user', error });
      this.requestsCounter.inc({ status: '500' });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to validate user',
      });
    }
  };
}
