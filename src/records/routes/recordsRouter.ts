import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { RecordsController } from '../controllers/recordsController';

const recordsRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(RecordsController);

  router.get('/:recordName', controller.getRecord);
  router.post('/:recordName', controller.createRecord);

  return router;
};

export const RECORDS_ROUTER_SYMBOL = Symbol('recordsRouterFactory');

export { recordsRouterFactory };
