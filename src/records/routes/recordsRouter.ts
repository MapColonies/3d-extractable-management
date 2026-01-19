import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { RecordsController } from '../controllers/recordsController';

const recordsRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(RecordsController);

  router.get('/', controller.getRecords);
  router.post('/validateCreate', controller.validateCreate);
  router.post('/validateDelete', controller.validateDelete);
  router.get('/:recordName', controller.getRecord);
  router.post('/:recordName', controller.createRecord);
  //router.delete('/:recordName', controller.deleteRecord);

  return router;
};

export const RECORDS_ROUTER_SYMBOL = Symbol('recordsRouterFactory');

export { recordsRouterFactory };
