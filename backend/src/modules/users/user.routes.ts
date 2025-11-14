import { Router } from 'express';
import { userController } from './user.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// ✅ Middleware global de autenticação
router.use(verifyTokenMiddleware);

// ✅ Dashboard
router.get('/dashboard', (req, res) => userController.getDashboard(req, res));

// ✅ Perfil
router.get('/profile', (req, res) => userController.getProfile(req, res));
router.put('/profile', (req, res) => userController.updateProfile(req, res));

// ✅ Nível do usuário
router.get('/me/level', (req, res) => userController.getUserLevel(req, res));

// ✅ Equipe
router.post('/team/add', (req, res) => userController.addMember(req, res));
router.get('/team/members', (req, res) => userController.getMyTeam(req, res));
router.get('/team/network', (req, res) => userController.getFullNetwork(req, res));
router.get('/team/stats', (req, res) => userController.getTeamStats(req, res));
router.get('/team/check', (req, res) => userController.checkHasTeam(req, res));
router.delete('/team/members/:id', (req, res) => userController.removeTeamMember(req, res));

// ✅ CRUD geral
router.get('/', (req, res) => userController.list(req, res));
router.get('/:id', (req, res) => userController.find(req, res));
router.put('/:id', (req, res) => userController.update(req, res));
router.delete('/:id', (req, res) => userController.remove(req, res));

export default router;
