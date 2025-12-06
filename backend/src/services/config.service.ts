import { pool } from '@config/database';
import { logger } from '../utils/logger';

/**
 * 🔧 ConfigService - Gerencia configurações dinâmicas do sistema
 * 
 * ✅ Features:
 * - Cache em memória (evita queries repetidas)
 * - Type-safe (TypeScript)
 * - Fallback para valores padrão
 * - Invalidação de cache
 */
class ConfigService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hora em ms

  /**
   * Buscar configuração do banco (com cache)
   */
  private async getConfig(configKey: string): Promise<any> {
    const now = Date.now();
    
    // Verificar cache
    if (this.cache.has(configKey)) {
      const expiry = this.cacheExpiry.get(configKey) || 0;
      if (now < expiry) {
        logger.debug(`📦 Config cache HIT: ${configKey}`);
        return this.cache.get(configKey);
      }
    }

    // Cache miss ou expirado - buscar do banco
    logger.debug(`🔍 Config cache MISS: ${configKey} - buscando do banco`);
    try {
      const result = await pool.query(
        `SELECT config_value FROM business_config WHERE config_key = $1`,
        [configKey]
      );

      if (result.rows.length === 0) {
        logger.warn(`⚠️ Configuração não encontrada: ${configKey}`);
        return null;
      }

      const value = result.rows[0].config_value;
      
      // Salvar no cache
      this.cache.set(configKey, value);
      this.cacheExpiry.set(configKey, now + this.CACHE_TTL);
      
      return value;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar configuração ${configKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Invalidar cache (chamar após UPDATE de configuração)
   */
  invalidateCache(configKey?: string) {
    if (configKey) {
      this.cache.delete(configKey);
      this.cacheExpiry.delete(configKey);
      logger.info(`🔄 Cache invalidado: ${configKey}`);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
      logger.info(`🔄 Cache completo invalidado`);
    }
  }

  /**
   * 💰 Buscar taxa de comissão pessoal
   */
  async getPersonalCommissionRate(role: string): Promise<number> {
    const config = await this.getConfig('commission_rates_personal');
    return config?.[role] ?? 5; // Fallback: 5%
  }

  /**
   * 🏥 Buscar taxa de comissão de seguro
   */
  async getInsuranceCommissionRate(role: string): Promise<number> {
    const config = await this.getConfig('commission_rates_insurance');
    return config?.[role] ?? 5; // Fallback: 5%
  }

  /**
   * 🌐 Buscar taxa de comissão de rede (1ª linha)
   */
  async getNetworkCommissionRateLine1(role: string): Promise<number> {
    const config = await this.getConfig('commission_rates_network_line1');
    return config?.[role] ?? 0;
  }

  /**
   * 🌐 Buscar taxa de comissão de rede (demais linhas)
   */
  async getNetworkCommissionRateRest(role: string): Promise<number> {
    const config = await this.getConfig('commission_rates_network_rest');
    return config?.[role] ?? 0;
  }

  /**
   * 💵 Buscar ajuda de custo fixa
   */
  async getFixedAllowance(role: string): Promise<number> {
    const config = await this.getConfig('fixed_allowances');
    return config?.[role] ?? 0;
  }

  /**
   * 🎯 Buscar meta mensal de kW
   */
  async getMonthlyKwTarget(role: string): Promise<number> {
    const config = await this.getConfig('monthly_kw_targets');
    return config?.[role] ?? 0;
  }

  /**
   * 📋 Buscar meta mensal de contratos
   */
  async getMonthlyContractTarget(role: string): Promise<number> {
    const config = await this.getConfig('monthly_contract_targets');
    return config?.[role] ?? 1;
  }

  /**
   * 🏆 Buscar pontos necessários para avanço
   */
  async getLevelAdvancementPoints(role: string): Promise<number> {
    const config = await this.getConfig('level_advancement_points');
    return config?.[role] ?? 10000;
  }

  /**
   * 🎁 Buscar bônus de avanço
   */
  async getAdvancementBonus(role: string): Promise<number> {
    const config = await this.getConfig('advancement_bonuses');
    return config?.[role] ?? 0;
  }

  /**
   * 🎁 Buscar prêmio de avanço
   */
  async getAdvancementReward(role: string): Promise<string> {
    const config = await this.getConfig('advancement_rewards');
    return config?.[role] ?? '';
  }

  /**
   * 🔢 Buscar profundidade máxima de rede
   */
  async getMaxNetworkDepth(role: string): Promise<number> {
    const config = await this.getConfig('max_network_depth');
    return config?.[role] ?? 0;
  }

  /**
   * 🛡️ Buscar penalidades
   */
  async getPenaltyConfig(): Promise<{ months_to_reset_points: number; months_to_demote: number }> {
    const config = await this.getConfig('penalty_months_below_target');
    return {
      months_to_reset_points: config?.months_to_reset_points ?? 3,
      months_to_demote: config?.months_to_demote ?? 0
    };
  }

  /**
   * ✏️ Atualizar configuração (admin only)
   */
  async updateConfig(configKey: string, newValue: any, updatedBy: string = 'SYSTEM'): Promise<void> {
    try {
      await pool.query(
        `UPDATE business_config 
         SET config_value = $1, updated_by = $2
         WHERE config_key = $3`,
        [JSON.stringify(newValue), updatedBy, configKey]
      );

      // Invalidar cache
      this.invalidateCache(configKey);
      
      logger.info(`✅ Configuração atualizada: ${configKey} por ${updatedBy}`);
    } catch (error: any) {
      logger.error(`❌ Erro ao atualizar configuração ${configKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 Listar todas as configurações (admin)
   */
  async getAllConfigs(): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT config_key, config_value, description, category, version, updated_at, updated_by
         FROM business_config
         ORDER BY category, config_key`
      );
      return result.rows;
    } catch (error: any) {
      logger.error(`❌ Erro ao listar configurações: ${error.message}`);
      return [];
    }
  }
}

export const configService = new ConfigService();
