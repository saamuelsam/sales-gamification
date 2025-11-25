// backend/src/modules/settings/settings.routes.ts

import { Router } from 'express';
import settingsController from './settings.controller';

const router = Router();

// Buscar todas as configurações
router.get('/', (req, res) => settingsController.getSettings(req, res));

// Buscar configuração específica
router.get('/:key', (req, res) => settingsController.getSetting(req, res));

// Atualizar configuração
router.put('/:key', (req, res) => settingsController.updateSetting(req, res));

// Toggle contratos por mês (atalho)
router.post('/contracts-per-month/toggle', (req, res) => 
  settingsController.toggleContractsPerMonth(req, res)
);

export default router;
