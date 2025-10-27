// backend/src/modules/users/user.routes.ts
import { Router } from 'express';
import { UserController } from './user.controller';
import { verifyTokenMiddleware } from '@middleware/auth.middleware';

const router = Router();
const controller = new UserController();

router.use(verifyTokenMiddleware);

// Rotas de equipe
router.post('/team/add', controller.addMember.bind(controller));
router.get('/team/members', controller.getMyTeam.bind(controller));
router.get('/team/network', controller.getFullNetwork.bind(controller));
router.get('/team/stats', controller.getTeamStats.bind(controller));
router.get('/team/check', controller.checkHasTeam.bind(controller));

// Rotas gerais (se realmente necessárias)
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.find.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.remove.bind(controller));

export default router;
