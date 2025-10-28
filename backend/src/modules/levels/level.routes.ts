// backend/src/modules/levels/level.routes.ts
import { Router } from 'express';
import { LevelController } from './level.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();
const controller = new LevelController();

// público
router.get('/', controller.list.bind(controller));

// autenticado
router.get('/:id', verifyTokenMiddleware, controller.find.bind(controller));

// admin
router.post('/', verifyTokenMiddleware, requireRoles('admin'), controller.create.bind(controller));
router.put('/:id', verifyTokenMiddleware, requireRoles('admin'), controller.update.bind(controller));

export default router;
