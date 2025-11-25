// backend/src/modules/settings/settings.service.ts

import { pool } from '@config/database';

export class SettingsService {
  /**
   * Buscar valor de uma configuração
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        [key]
      );
      
      return result.rows[0]?.setting_value || null;
    } catch (error) {
      console.error(`Erro ao buscar configuração ${key}:`, error);
      return null;
    }
  }

  /**
   * Buscar valor booleano de uma configuração
   */
  async getBooleanSetting(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.getSetting(key);
    if (value === null) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Atualizar uma configuração
   */
  async updateSetting(key: string, value: string, userId?: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE system_settings 
         SET setting_value = $1, updated_by = $2, updated_at = NOW()
         WHERE setting_key = $3`,
        [value, userId || null, key]
      );
      
      console.log(`✅ Configuração ${key} atualizada para: ${value}`);
    } catch (error) {
      console.error(`Erro ao atualizar configuração ${key}:`, error);
      throw error;
    }
  }

  /**
   * Buscar todas as configurações
   */
  async getAllSettings(): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT 
          s.id,
          s.setting_key,
          s.setting_value,
          s.description,
          s.updated_at,
          u.name as updated_by_name
         FROM system_settings s
         LEFT JOIN users u ON s.updated_by = u.id
         ORDER BY s.setting_key`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw error;
    }
  }

  /**
   * Verificar se contratos por mês está ativado
   */
  async isContractsPerMonthEnabled(): Promise<boolean> {
    return await this.getBooleanSetting('contracts_per_month_enabled', true);
  }

  /**
   * Ativar/desativar contratos por mês
   */
  async setContractsPerMonthEnabled(enabled: boolean, userId?: string): Promise<void> {
    await this.updateSetting('contracts_per_month_enabled', enabled.toString(), userId);
    console.log(`📋 Contratos por mês ${enabled ? 'ATIVADO' : 'DESATIVADO'} por ${userId || 'sistema'}`);
  }
}

export default new SettingsService();
