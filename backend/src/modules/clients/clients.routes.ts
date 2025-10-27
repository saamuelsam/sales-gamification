// backend/src/modules/clients/clients.routes.ts
import { Router } from 'express';
import { ClientsController } from './clients.controller';
import { verifyTokenMiddleware } from '@middleware/auth.middleware';

const router = Router();
const controller = new ClientsController();

router.use(verifyTokenMiddleware);

router.post('/', controller.create.bind(controller));
router.get('/', controller.list.bind(controller));
router.put('/:id', controller.update.bind(controller));

export default router;
