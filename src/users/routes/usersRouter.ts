import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { UsersController } from '../controllers/usersController';

const usersRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(UsersController);

  router.post('/validate', controller.validateUser);

  return router;
};

export const USERS_ROUTER_SYMBOL = Symbol('usersRouterFactory');

export { usersRouterFactory };
