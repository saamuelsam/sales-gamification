import { Router } from 'express';
import { AuthController } from './auth.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/me', verifyTokenMiddleware, authController.me.bind(authController));

export default router;
