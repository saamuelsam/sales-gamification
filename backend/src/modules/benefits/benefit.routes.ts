// backend/src/modules/benefits/benefit.routes.ts
import { Router } from 'express';
import { BenefitController } from './benefit.controller';
import { verifyTokenMiddleware } from '@middleware/auth.middleware';
import { requireRoles } from '@middleware/role.middleware';

const router = Router();
const controller = new BenefitController();

router.use(verifyTokenMiddleware);

router.get('/', controller.list.bind(controller));
router.get('/level/:levelId', controller.getByLevel.bind(controller));
router.get('/user/:userId?', controller.getUserBenefits.bind(controller));

router.post('/', requireRoles('admin'), controller.create.bind(controller));
router.put('/:id', requireRoles('admin'), controller.update.bind(controller));
router.delete('/:id', requireRoles('admin'), controller.remove.bind(controller));

export default router;
