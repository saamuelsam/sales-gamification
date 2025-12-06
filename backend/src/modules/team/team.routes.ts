// backend/src/modules/team/team.routes.ts
import { Router } from 'express';
import { teamController } from '../team/team.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { verifyTeamHierarchy, verifyParentId } from '../../middleware/ownership.middleware';
import { 
  validate, 
  addTeamMemberSchema, 
  validateUUID,
  sanitizeStrings 
} from '../../middleware/validation.middleware';

const router = Router();

// ✅ Middleware global de autenticação e sanitização
router.use(verifyTokenMiddleware);
router.use(sanitizeStrings);

// ✅ Listar membros da equipe (própria equipe)
router.get('/members', (req, res, next) => 
  teamController.getTeamMembers(req, res).catch(next)
);

// ✅ Adicionar membro à equipe (validação de parent_id)
router.post('/members', validate(addTeamMemberSchema), verifyParentId, (req, res, next) => 
  teamController.addTeamMember(req, res).catch(next)
);

// ✅ Remover membro (validação de hierarquia)
router.delete('/members/:memberId', validateUUID('memberId'), verifyTeamHierarchy, (req, res, next) => 
  teamController.removeTeamMember(req, res).catch(next)
);

// ✅ Estatísticas da equipe (própria equipe)
router.get('/stats', (req, res, next) => 
  teamController.getTeamStats(req, res).catch(next)
);

export default router;
