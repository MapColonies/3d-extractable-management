import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { AuditController } from '../controllers/auditController';

const auditRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(AuditController);

  router.get('/:recordName', controller.getAudit);

  return router;
};

export const AUDIT_ROUTER_SYMBOL = Symbol('auditRouterFactory');

export { auditRouterFactory };
