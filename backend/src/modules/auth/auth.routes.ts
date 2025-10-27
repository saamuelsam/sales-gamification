import { Router } from 'express';
import { AuthController } from './auth.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyTokenMiddleware, authController.me);

export default router;
