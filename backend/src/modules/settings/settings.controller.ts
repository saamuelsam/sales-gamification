// backend/src/modules/settings/settings.controller.ts

import { Request, Response } from 'express';
import settingsService from './settings.service';

class SettingsController {
  /**
   * GET /api/admin/settings
   * Buscar todas as configurações
   */
  async getSettings(req: Request, res: Response) {
    try {
      const settings = await settingsService.getAllSettings();
      
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar configurações',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/settings/:key
   * Buscar uma configuração específica
   */
  async getSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const value = await settingsService.getSetting(key);
      
      if (value === null) {
        return res.status(404).json({
          success: false,
          message: 'Configuração não encontrada',
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          key,
          value,
        },
      });
    } catch (error: any) {
      console.error('Erro ao buscar configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar configuração',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/settings/:key
   * Atualizar uma configuração
   */
  async updateSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const userId = (req as any).user?.id;
      
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Valor da configuração é obrigatório',
        });
      }
      
      await settingsService.updateSetting(key, String(value), userId);
      
      res.status(200).json({
        success: true,
        message: 'Configuração atualizada com sucesso',
        data: {
          key,
          value: String(value),
        },
      });
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configuração',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/admin/settings/contracts-per-month/toggle
   * Alternar contratos por mês (ativar/desativar)
   */
  async toggleContractsPerMonth(req: Request, res: Response) {
    try {
      const { enabled } = req.body;
      const userId = (req as any).user?.id;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro "enabled" deve ser boolean',
        });
      }
      
      await settingsService.setContractsPerMonthEnabled(enabled, userId);
      
      res.status(200).json({
        success: true,
        message: `Contratos por mês ${enabled ? 'ativado' : 'desativado'} com sucesso`,
        data: {
          contracts_per_month_enabled: enabled,
        },
      });
    } catch (error: any) {
      console.error('Erro ao alternar contratos por mês:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alternar contratos por mês',
        error: error.message,
      });
    }
  }
}

export default new SettingsController();
