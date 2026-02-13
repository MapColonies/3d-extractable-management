import { Router } from 'express';
import type { DependencyContainer } from 'tsyringe';
import { RecordsController } from '../controllers/recordsController';

const recordsRouterFactory = (dependencyContainer: DependencyContainer, options?: { internal?: boolean }): Router => {
  const router = Router();
  const controller = dependencyContainer.resolve(RecordsController);

  router.get('/', controller.getRecords);
  router.get('/:recordName', controller.getRecord);

  if (options?.internal === true) {
    router.post('/validateCreate', controller.validateCreate);
    router.post('/validateDelete', controller.validateDelete);
    router.post('/:recordName', controller.createRecord);
    router.delete('/:recordName', controller.deleteRecord);
  }

  return router;
};

export const RECORDS_ROUTER_SYMBOL = Symbol('recordsRouterFactory');

export { recordsRouterFactory };
