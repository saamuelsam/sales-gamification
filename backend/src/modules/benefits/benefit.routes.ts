// backend/src/modules/benefits/benefit.routes.ts

import { Router } from 'express';
import { BenefitController } from './benefit.controller';
import { verifyToken } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/role.middleware';

const router = Router();
const controller = new BenefitController();

router.get('/', verifyToken, controller.list);
router.get('/level/:levelId', verifyToken, controller.getByLevel);
router.get('/user/:userId?', verifyToken, controller.getUserBenefits);
router.post('/', verifyToken, requireRole(['admin']), controller.create);
router.put('/:id', verifyToken, requireRole(['admin']), controller.update);
router.delete('/:id', verifyToken, requireRole(['admin']), controller.remove);

export default router;
