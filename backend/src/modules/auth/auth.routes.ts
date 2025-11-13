import { Router } from 'express';
import { AuthController } from './auth.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', verifyTokenMiddleware, authController.me.bind(authController));

// Rotas de verificação de email
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authController.resendVerification.bind(authController));

// Rotas de reset de senha
router.post('/forgot-password', authController.requestPasswordReset.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

export default router;
