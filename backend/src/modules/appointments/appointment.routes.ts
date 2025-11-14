// backend/src/modules/appointments/appointment.routes.ts

import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { verifyTokenMiddleware } from '@middleware/auth.middleware';

const router = Router();

// Todas as rotas exigem autenticação
router.use(verifyTokenMiddleware);

// Rotas especiais (devem vir antes das rotas com :id)
router.get('/today', (req, res) => appointmentController.getTodayAppointments(req, res));
router.get('/week', (req, res) => appointmentController.getWeekAppointments(req, res));
router.get('/stats', (req, res) => appointmentController.getAppointmentStats(req, res));

// Rotas CRUD padrão
router.post('/', (req, res) => appointmentController.createAppointment(req, res));
router.get('/', (req, res) => appointmentController.getUserAppointments(req, res));
router.get('/:id', (req, res) => appointmentController.getAppointmentById(req, res));
router.put('/:id', (req, res) => appointmentController.updateAppointment(req, res));
router.delete('/:id', (req, res) => appointmentController.deleteAppointment(req, res));

// Rotas de ação
router.post('/:id/cancel', (req, res) => appointmentController.cancelAppointment(req, res));
router.post('/:id/complete', (req, res) => appointmentController.completeAppointment(req, res));

export default router;
