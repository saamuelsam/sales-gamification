"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ✅ Middleware global de autenticação
router.use(auth_middleware_1.verifyTokenMiddleware);
// ✅ Dashboard
router.get('/dashboard', (req, res) => user_controller_1.userController.getDashboard(req, res));
// ✅ Equipe
router.post('/team/add', (req, res) => user_controller_1.userController.addMember(req, res));
router.get('/team/members', (req, res) => user_controller_1.userController.getMyTeam(req, res));
router.get('/team/network', (req, res) => user_controller_1.userController.getFullNetwork(req, res));
router.get('/team/stats', (req, res) => user_controller_1.userController.getTeamStats(req, res));
router.get('/team/check', (req, res) => user_controller_1.userController.checkHasTeam(req, res));
router.delete('/team/members/:id', (req, res) => user_controller_1.userController.removeTeamMember(req, res));
// ✅ CRUD geral
router.get('/', (req, res) => user_controller_1.userController.list(req, res));
router.get('/:id', (req, res) => user_controller_1.userController.find(req, res));
router.put('/:id', (req, res) => user_controller_1.userController.update(req, res));
router.delete('/:id', (req, res) => user_controller_1.userController.remove(req, res));
exports.default = router;
