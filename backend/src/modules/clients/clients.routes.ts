import { Router } from 'express';
import { ClientsController } from './clients.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const clientsController = new ClientsController();

router.use(verifyTokenMiddleware);

router.post('/', clientsController.create);
router.get('/', clientsController.list);
router.put('/:id', clientsController.update);


export default router;
