"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/team/team.routes.ts
const express_1 = require("express");
const team_controller_1 = require("../team/team.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Listar membros da equipe
router.get('/members', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => team_controller_1.teamController.getTeamMembers(req, res).catch(next));
// Adicionar membro à equipe
router.post('/members', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => team_controller_1.teamController.addTeamMember(req, res).catch(next));
// Remover membro
router.delete('/members/:memberId', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => team_controller_1.teamController.removeTeamMember(req, res).catch(next));
// Estatísticas da equipe
router.get('/stats', auth_middleware_1.verifyTokenMiddleware, (req, res, next) => team_controller_1.teamController.getTeamStats(req, res).catch(next));
exports.default = router;
