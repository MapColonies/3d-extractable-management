import { Router } from 'express';
import type { DependencyContainer } from 'tsyringe';
import { UsersController } from '../controllers/usersController';

const usersRouterFactory = (dependencyContainer: DependencyContainer, options?: { internal?: boolean }): Router => {
  const router = Router();
  const controller = dependencyContainer.resolve(UsersController);

  if (options?.internal === true) {
    router.post('/validate', controller.validateUser);
  }

  return router;
};

export const USERS_ROUTER_SYMBOL = Symbol('usersRouterFactory');

export { usersRouterFactory };
