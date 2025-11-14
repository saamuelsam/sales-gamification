import { Router } from 'express';
import { AuthController } from './auth.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/security.middleware';

const router = Router();
const authController = new AuthController();

// ✅ Rotas com rate limiting para prevenir força bruta
router.post('/register', authLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.get('/me', verifyTokenMiddleware, authController.me.bind(authController));

// Rotas de verificação de email
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authLimiter, authController.resendVerification.bind(authController));

// Rotas de reset de senha (também com rate limiting)
router.post('/forgot-password', authLimiter, authController.requestPasswordReset.bind(authController));
router.post('/reset-password', authLimiter, authController.resetPassword.bind(authController));

export default router;
