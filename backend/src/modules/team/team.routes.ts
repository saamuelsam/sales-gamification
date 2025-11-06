// backend/src/modules/team/team.routes.ts
import { Router } from 'express';
import { teamController } from '../team/team.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Listar membros da equipe
router.get('/members', verifyTokenMiddleware, (req, res, next) => 
  teamController.getTeamMembers(req, res).catch(next)
);

// Adicionar membro à equipe
router.post('/members', verifyTokenMiddleware, (req, res, next) => 
  teamController.addTeamMember(req, res).catch(next)
);

// Remover membro
router.delete('/members/:memberId', verifyTokenMiddleware, (req, res, next) => 
  teamController.removeTeamMember(req, res).catch(next)
);

// Estatísticas da equipe
router.get('/stats', verifyTokenMiddleware, (req, res, next) => 
  teamController.getTeamStats(req, res).catch(next)
);

export default router;
