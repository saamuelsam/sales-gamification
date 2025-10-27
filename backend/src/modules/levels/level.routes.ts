// backend/src/modules/levels/level.routes.ts

import { Router } from 'express';
import { LevelController } from './level.controller';
import { verifyToken } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/role.middleware';

const router = Router();
const controller = new LevelController();

router.get('/', controller.list); // Público
router.get('/:id', verifyToken, controller.find);
router.post('/', verifyToken, requireRole(['admin']), controller.create);
router.put('/:id', verifyToken, requireRole(['admin']), controller.update);

export default router;
