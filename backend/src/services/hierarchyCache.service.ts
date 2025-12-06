import { createClient, RedisClientType } from 'redis';
import { pool } from '@config/database';
import { logger } from '../utils/logger';

/**
 * 🚀 HierarchyCache - Cache Redis para hierarquia de usuários
 * 
 * ✅ Features:
 * - Cache de hierarquia (reduz O(N) para O(1))
 * - Invalidação automática em mudanças
 * - Fallback para banco se Redis falhar
 * - TTL configurável
 */
class HierarchyCacheService {
  private redisClient: RedisClientType | null = null;
  private isConnected: boolean = false;
  private readonly CACHE_TTL = 3600; // 1 hora

  /**
   * Conectar ao Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisClient = createClient({ url: redisUrl });
      
      this.redisClient.on('error', (err) => {
        logger.error(`❌ Redis Error: ${err.message}`);
        this.isConnected = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('✅ Redis conectado');
        this.isConnected = true;
      });

      await this.redisClient.connect();
    } catch (error: any) {
      logger.error(`❌ Erro ao conectar Redis: ${error.message}`);
      this.isConnected = false;
    }
  }

  /**
   * 🔍 Buscar líderes da hierarquia (com cache)
   */
  async getLeadersHierarchy(subordinateId: string, maxDepth: number = 10): Promise<any[]> {
    const cacheKey = `hierarchy:leaders:${subordinateId}:${maxDepth}`;

    // Tentar buscar do cache primeiro
    if (this.isConnected && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        
        if (cached) {
          logger.debug(`📦 Hierarchy cache HIT: ${subordinateId}`);
          return JSON.parse(cached);
        }
      } catch (error: any) {
        logger.warn(`⚠️ Erro ao buscar cache Redis: ${error.message} - usando banco`);
      }
    }

    // Cache miss ou Redis indisponível - buscar do banco
    logger.debug(`🔍 Hierarchy cache MISS: ${subordinateId} - buscando do banco`);
    
    try {
      const result = await pool.query(
        `SELECT u.id, u.role, u.name, uh.line_level
         FROM user_hierarchy uh
         JOIN users u ON uh.leader_id = u.id
         WHERE uh.subordinate_id = $1 AND uh.line_level <= $2
         ORDER BY uh.line_level ASC`,
        [subordinateId, maxDepth]
      );

      const leaders = result.rows;

      // Salvar no cache
      if (this.isConnected && this.redisClient && leaders.length > 0) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            this.CACHE_TTL,
            JSON.stringify(leaders)
          );
          logger.debug(`💾 Hierarchy cached: ${subordinateId} (${leaders.length} leaders)`);
        } catch (error: any) {
          logger.warn(`⚠️ Erro ao salvar cache Redis: ${error.message}`);
        }
      }

      return leaders;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar hierarquia do banco: ${error.message}`);
      return [];
    }
  }

  /**
   * 🔍 Buscar subordinados diretos (com cache)
   */
  async getDirectSubordinates(leaderId: string): Promise<any[]> {
    const cacheKey = `hierarchy:subordinates:${leaderId}:direct`;

    // Tentar cache
    if (this.isConnected && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`📦 Subordinates cache HIT: ${leaderId}`);
          return JSON.parse(cached);
        }
      } catch (error: any) {
        logger.warn(`⚠️ Erro ao buscar cache: ${error.message}`);
      }
    }

    // Buscar do banco
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, uh.line_level
         FROM user_hierarchy uh
         JOIN users u ON uh.subordinate_id = u.id
         WHERE uh.leader_id = $1 AND uh.line_level = 1
         ORDER BY u.name ASC`,
        [leaderId]
      );

      const subordinates = result.rows;

      // Cachear
      if (this.isConnected && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            this.CACHE_TTL,
            JSON.stringify(subordinates)
          );
        } catch (error: any) {
          logger.warn(`⚠️ Erro ao cachear: ${error.message}`);
        }
      }

      return subordinates;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar subordinados: ${error.message}`);
      return [];
    }
  }

  /**
   * 🔄 Invalidar cache de hierarquia (chamar após mudanças)
   */
  async invalidateHierarchyCache(userId: string): Promise<void> {
    if (!this.isConnected || !this.redisClient) return;

    try {
      // Invalidar cache do usuário como subordinado
      const keysPattern1 = `hierarchy:leaders:${userId}:*`;
      const keys1 = await this.redisClient.keys(keysPattern1);
      
      // Invalidar cache do usuário como líder
      const keysPattern2 = `hierarchy:subordinates:${userId}:*`;
      const keys2 = await this.redisClient.keys(keysPattern2);

      const allKeys = [...keys1, ...keys2];
      
      if (allKeys.length > 0) {
        await this.redisClient.del(allKeys);
        logger.info(`🔄 Cache invalidado: ${allKeys.length} keys para user ${userId}`);
      }
    } catch (error: any) {
      logger.error(`❌ Erro ao invalidar cache: ${error.message}`);
    }
  }

  /**
   * 🔄 Invalidar todo o cache de hierarquia
   */
  async invalidateAllHierarchyCache(): Promise<void> {
    if (!this.isConnected || !this.redisClient) return;

    try {
      const keys = await this.redisClient.keys('hierarchy:*');
      
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        logger.info(`🔄 Cache completo invalidado: ${keys.length} keys`);
      }
    } catch (error: any) {
      logger.error(`❌ Erro ao invalidar cache completo: ${error.message}`);
    }
  }

  /**
   * 📊 Estatísticas do cache
   */
  async getCacheStats(): Promise<any> {
    if (!this.isConnected || !this.redisClient) {
      return { connected: false };
    }

    try {
      const keys = await this.redisClient.keys('hierarchy:*');
      const info = await this.redisClient.info('memory');
      
      return {
        connected: true,
        totalKeys: keys.length,
        memoryInfo: info
      };
    } catch (error: any) {
      logger.error(`❌ Erro ao obter stats: ${error.message}`);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Desconectar Redis
   */
  async disconnect(): Promise<void> {
    if (this.redisClient && this.isConnected) {
      await this.redisClient.quit();
      this.isConnected = false;
      logger.info('👋 Redis desconectado');
    }
  }
}

export const hierarchyCacheService = new HierarchyCacheService();

// Conectar ao Redis na inicialização
hierarchyCacheService.connect().catch((err) => {
  logger.warn(`⚠️ Redis não disponível - sistema funcionará sem cache: ${err.message}`);
});
