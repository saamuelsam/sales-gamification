// backend/src/modules/levels/level.routes.ts

import { Router } from 'express';
import { levelController } from './level.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

// ============ AUTENTICADO (ESPECÍFICAS PRIMEIRO!) ============
router.get('/goals/my-goals', verifyTokenMiddleware, levelController.getUserGoals.bind(levelController));
router.get('/pathway/user-pathway', verifyTokenMiddleware, levelController.getLevelPathway.bind(levelController));
router.get('/by-points/:points', verifyTokenMiddleware, levelController.findByPoints.bind(levelController));

// ============ PÚBLICO ============
router.get('/', levelController.list.bind(levelController));

// ============ ESPECÍFICO POR ID ============
router.get('/:id', verifyTokenMiddleware, levelController.find.bind(levelController));

// ============ ADMIN ============
router.post('/', verifyTokenMiddleware, requireRoles('admin'), levelController.create.bind(levelController));
router.put('/:id', verifyTokenMiddleware, requireRoles('admin'), levelController.update.bind(levelController));
router.delete('/:id', verifyTokenMiddleware, requireRoles('admin'), levelController.delete.bind(levelController));

export default router;
