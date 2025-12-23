// backend/src/utils/activityLogger.ts
import { pool } from '../config/database';
import { logger } from './logger';

/**
 * Interface para metadata dos logs
 */
interface ActivityLogMetadata {
  [key: string]: any;
}

/**
 * Tipos de ações permitidas (para melhor organização)
 */
export enum ActivityAction {
  // Ações de Equipe
  ADD_TEAM_MEMBER = 'Adicionou novo membro à equipe',
  REMOVE_TEAM_MEMBER = 'Removeu membro da equipe',
  
  // Ações de Comissões
  NEW_COMMISSION = 'Recebeu nova comissão da rede',
  PERSONAL_COMMISSION = 'Recebeu comissão pessoal',
  NETWORK_COMMISSION = 'Recebeu comissão de rede',
  MARK_COMMISSION_PAID = 'Marcou comissão como paga',
  ADMIN_MARK_COMMISSION_PAID = 'Marcou comissão como paga (admin)',
  
  // Ações de Vendas
  CREATE_SALE = 'Registrou nova venda',
  UPDATE_SALE = 'Atualizou venda',
  DELETE_SALE = 'Removeu venda',
  APPROVE_SALE = 'Venda aprovada',
  REJECT_SALE = 'Venda rejeitada',
  
  // Ações de Níveis
  LEVEL_UP = 'Subiu de nível',
  LEVEL_DOWN = 'Rebaixado de nível',
  
  // Ações de Recompensas
  REWARD_EARNED = 'Conquistou recompensa',
  REWARD_CLAIMED = 'Resgatou recompensa',
  
  // Ações Administrativas
  UPDATE_USER_STATUS = 'Atualizou status de usuário',
  UPDATE_USER_ROLE = 'Alterou função de usuário',
  UPDATE_SYSTEM_CONFIG = 'Alterou configurações globais',
  SEND_GLOBAL_NOTIFICATION = 'Enviou notificação global',
  DELETE_NOTIFICATION = 'Deletou notificação',
  
  // Ações do CEO
  CEO_UPDATE_USER = 'CEO atualizou dados do usuário',
  CEO_CHANGE_ROLE = 'CEO alterou cargo do usuário',
  CEO_ADJUST_POINTS = 'CEO ajustou pontos do usuário',
  CEO_CREATE_SALE = 'CEO criou venda para usuário',
  CEO_TOGGLE_USER_STATUS = 'CEO alterou status do usuário',
  CEO_TRANSFER_USER = 'CEO transferiu usuário para outro patrocinador',
  CEO_RESET_PASSWORD = 'CEO resetou senha do usuário',
  CEO_VERIFY_USER_EMAIL = 'CEO verificou email do usuário manualmente',
  CEO_UNVERIFY_USER_EMAIL = 'CEO removeu verificação de email do usuário',
  
  // Ações de Autenticação
  USER_LOGIN = 'Realizou login',
  USER_LOGOUT = 'Realizou logout',
  FAILED_LOGIN = 'Tentativa de login falhou',
  PASSWORD_RESET = 'Redefiniu senha',
  REGISTER = 'Registrou novo usuário',
  
  // Erros
  SYSTEM_ERROR = 'Erro crítico do sistema',
  USER_ERROR = 'Erro na operação do usuário',
}

/**
 * ✅ Registrar atividade do usuário no sistema
 * 
 * @param userId - ID do usuário (null para ações do sistema)
 * @param action - Descrição da ação realizada
 * @param metadata - Dados adicionais sobre a ação
 */
export async function logActivity(
  userId: string | null,
  action: string | ActivityAction,
  metadata?: ActivityLogMetadata
): Promise<void> {
  try {
    // Validar se a tabela existe antes de inserir
    const tableExists = await checkTableExists();
    if (!tableExists) {
      logger.warn('⚠️ Tabela activity_logs não existe. Pulando log.');
      return;
    }

    // Preparar metadata
    const preparedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Inserir no banco
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, action, JSON.stringify(preparedMetadata)]
    );

    // Log informativo (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`📝 [ACTIVITY_LOG] ${action} - User: ${userId || 'SYSTEM'}`);
    }
  } catch (error: any) {
    // Não quebrar a aplicação se o log falhar
    logger.error(`❌ [ACTIVITY_LOG] Erro ao registrar: ${error.message}`);
    
    // Em produção, pode enviar para serviço de monitoramento (Sentry, etc)
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error);
    }
  }
}

/**
 * ✅ Registrar múltiplas atividades em lote
 * Útil para operações em massa
 */
export async function logActivitiesBatch(
  activities: Array<{
    userId: string | null;
    action: string | ActivityAction;
    metadata?: ActivityLogMetadata;
  }>
): Promise<void> {
  try {
    const tableExists = await checkTableExists();
    if (!tableExists) return;

    // Preparar valores para insert em lote
    const values: any[] = [];
    const placeholders: string[] = [];
    
    activities.forEach((activity, index) => {
      const offset = index * 3;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      
      values.push(
        activity.userId,
        activity.action,
        JSON.stringify({
          ...activity.metadata,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Insert em lote
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, metadata)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    logger.info(`📝 [ACTIVITY_LOG] ${activities.length} logs registrados em lote`);
  } catch (error: any) {
    logger.error(`❌ [ACTIVITY_LOG] Erro ao registrar lote: ${error.message}`);
  }
}

/**
 * ✅ Buscar logs de atividade de um usuário específico
 */
export async function getUserActivityLogs(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT id, action, metadata, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error: any) {
    logger.error(`❌ [ACTIVITY_LOG] Erro ao buscar logs do usuário: ${error.message}`);
    return [];
  }
}

/**
 * ✅ Buscar logs de atividade por ação
 */
export async function getActivityLogsByAction(
  action: string | ActivityAction,
  limit: number = 50
): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.action = $1
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [action, limit]
    );

    return result.rows;
  } catch (error: any) {
    logger.error(`❌ [ACTIVITY_LOG] Erro ao buscar logs por ação: ${error.message}`);
    return [];
  }
}

/**
 * ✅ Limpar logs antigos (manutenção)
 * Remove logs com mais de X dias
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const result = await pool.query(
      `DELETE FROM activity_logs
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING id`
    );

    const deletedCount = result.rowCount || 0;
    logger.info(`🧹 [ACTIVITY_LOG] ${deletedCount} logs antigos removidos`);
    
    return deletedCount;
  } catch (error: any) {
    logger.error(`❌ [ACTIVITY_LOG] Erro ao limpar logs antigos: ${error.message}`);
    return 0;
  }
}

/**
 * ✅ Verificar se a tabela activity_logs existe
 */
async function checkTableExists(): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'activity_logs'
       )`
    );
    
    return result.rows[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

/**
 * ✅ Estatísticas de logs de atividade
 */
export async function getActivityStats(days: number = 7): Promise<{
  totalLogs: number;
  logsByAction: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}> {
  try {
    // Total de logs
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int as total
       FROM activity_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'`
    );

    // Logs por ação
    const actionResult = await pool.query(
      `SELECT action, COUNT(*)::int as count
       FROM activity_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY action
       ORDER BY count DESC
       LIMIT 10`
    );

    // Top usuários
    const usersResult = await pool.query(
      `SELECT al.user_id as "userId", u.name as "userName", COUNT(*)::int as count
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.created_at >= NOW() - INTERVAL '${days} days'
         AND al.user_id IS NOT NULL
       GROUP BY al.user_id, u.name
       ORDER BY count DESC
       LIMIT 10`
    );

    return {
      totalLogs: totalResult.rows[0]?.total || 0,
      logsByAction: actionResult.rows,
      topUsers: usersResult.rows,
    };
  } catch (error: any) {
    logger.error(`❌ [ACTIVITY_LOG] Erro ao buscar estatísticas: ${error.message}`);
    return {
      totalLogs: 0,
      logsByAction: [],
      topUsers: [],
    };
  }
}
