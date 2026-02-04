import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { RecordsController } from '../controllers/recordsController';

const recordsRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(RecordsController);

  router.get('/', controller.getRecords);
  router.post('/validateCreate', controller.validateCreate);
  router.post('/validateDelete', controller.validateDelete);
  router.get('/:record_name', controller.getRecord);
  router.post('/:record_name', controller.createRecord);
  router.delete('/:record_name', controller.deleteRecord);

  return router;
};

export const RECORDS_ROUTER_SYMBOL = Symbol('recordsRouterFactory');

export { recordsRouterFactory };
