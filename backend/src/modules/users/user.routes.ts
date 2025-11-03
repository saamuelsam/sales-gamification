import { Router } from 'express';
import { userController } from './user.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(verifyTokenMiddleware);

// ✅ Dashboard
router.get('/dashboard', (req, res) => userController.getDashboard(req, res));

// Equipe
router.post('/team/add', (req, res) => userController.addMember(req, res));
router.get('/team/members', (req, res) => userController.getMyTeam(req, res));
router.get('/team/network', (req, res) => userController.getFullNetwork(req, res));
router.get('/team/stats', (req, res) => userController.getTeamStats(req, res));
router.get('/team/check', (req, res) => userController.checkHasTeam(req, res));

// CRUD
router.get('/', (req, res) => userController.list(req, res));
router.get('/:id', (req, res) => userController.find(req, res));
router.put('/:id', (req, res) => userController.update(req, res));
router.delete('/:id', (req, res) => userController.remove(req, res));

export default router;
