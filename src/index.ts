// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import { createServer } from 'http';
import { Registry } from 'prom-client';
import httpStatusCodes from 'http-status-codes';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '@common/constants';
import { ConfigType } from '@common/config';
import { getApp } from './app';

void getApp()
  .then(([app, container]) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port = config.get('server.port');

    const metricsRegistry = new Registry();

    void import('prom-client')
      .then(({ collectDefaultMetrics }) => collectDefaultMetrics({ register: metricsRegistry }))
      .catch((err) => logger.error({ msg: 'Failed to collect default metrics', error: err }));

    /* eslint-disable @typescript-eslint/no-misused-promises */
    app.get('/metrics', async (_req, res) => {
      try {
        res.set('Content-Type', metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
      } catch (err) {
        res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end(err instanceof Error ? err.message : 'Failed to collect metrics');
      }
    });

    const stubHealthCheck = async (): Promise<void> => Promise.resolve();

    const server = createTerminus(createServer(app), {
      healthChecks: { '/liveness': stubHealthCheck },
      onSignal: container.resolve<() => Promise<void>>('onSignal'),
    });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error);
    process.exit(1);
  });
