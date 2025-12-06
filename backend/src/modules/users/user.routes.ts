import { Router } from 'express';
import { userController } from './user.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { verifyAdminMiddleware } from '../../middleware/admin.middleware';
import { uploadAvatar } from '../../config/multer';
import { 
  verifyUserOwnership, 
  verifyTeamHierarchy, 
  verifyParentId 
} from '../../middleware/ownership.middleware';
import { 
  validate, 
  updateUserProfileSchema, 
  addTeamMemberSchema,
  validateUUID,
  sanitizeStrings
} from '../../middleware/validation.middleware';

const router = Router();

// ✅ Middleware global de autenticação e sanitização
router.use(verifyTokenMiddleware);
router.use(sanitizeStrings);

// ✅ Dashboard (próprio usuário)
router.get('/dashboard', (req, res) => userController.getDashboard(req, res));

// ✅ Perfil (próprio usuário)
router.get('/profile', (req, res) => userController.getProfile(req, res));
router.put('/profile', validate(updateUserProfileSchema), (req, res) => userController.updateProfile(req, res));
router.post('/avatar', uploadAvatar.single('avatar'), (req, res) => userController.uploadAvatar(req, res));
router.delete('/avatar', (req, res) => userController.deleteAvatar(req, res));

// ✅ Nível do usuário (próprio usuário)
router.get('/me/level', (req, res) => userController.getUserLevel(req, res));

// ✅ Histórico de pontos (próprio usuário)
router.get('/me/points/history', (req, res) => userController.getPointsHistory(req, res));

// ✅ Equipe (validação de hierarquia)
router.post('/team/add', validate(addTeamMemberSchema), verifyParentId, (req, res) => userController.addMember(req, res));
router.get('/team/members', (req, res) => userController.getMyTeam(req, res));
router.get('/team/network', (req, res) => userController.getFullNetwork(req, res));
router.get('/team/stats', (req, res) => userController.getTeamStats(req, res));
router.get('/team/check', (req, res) => userController.checkHasTeam(req, res));
router.delete('/team/members/:id', validateUUID('id'), verifyTeamHierarchy, (req, res) => userController.removeTeamMember(req, res));

// ✅ CRUD geral (apenas admins ou próprio usuário)
router.get('/', verifyAdminMiddleware, (req, res) => userController.list(req, res));
router.get('/:id', validateUUID('id'), verifyUserOwnership, (req, res) => userController.find(req, res));
router.put('/:id', validateUUID('id'), verifyUserOwnership, (req, res) => userController.update(req, res));
router.delete('/:id', validateUUID('id'), verifyUserOwnership, (req, res) => userController.remove(req, res));

export default router;
