"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', auth_middleware_1.verifyTokenMiddleware, authController.me.bind(authController));
// Rotas de verificação de email
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authController.resendVerification.bind(authController));
// Rotas de reset de senha
router.post('/forgot-password', authController.requestPasswordReset.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
exports.default = router;
