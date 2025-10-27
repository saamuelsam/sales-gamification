// backend/src/modules/users/user.routes.ts

import { Router } from 'express';
import { UserController } from './user.controller';
import { verifyToken } from '@middleware/auth.middleware';

const router = Router();
const controller = new UserController();

// Rotas de equipe (disponível para QUALQUER consultor)
router.post('/team/add', verifyToken, controller.addMember);
router.get('/team/members', verifyToken, controller.getMyTeam);
router.get('/team/network', verifyToken, controller.getFullNetwork);
router.get('/team/stats', verifyToken, controller.getTeamStats);
router.get('/team/check', verifyToken, controller.checkHasTeam);

// Rotas gerais
router.get('/', verifyToken, controller.list);
router.get('/:id', verifyToken, controller.find);
router.put('/:id', verifyToken, controller.update);
router.delete('/:id', verifyToken, controller.remove);

export default router;
