import winston from 'winston';
import { pool } from '../config/database';

/**
 * ✅ Criação do logger Winston
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// ✅ Adicionar saída no console em modo dev
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * ✅ Método auxiliar — verifica se a tabela activity_logs existe
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
  } catch {
    return false;
  }
}

/**
 * ✅ Salva erros críticos no banco
 */
async function saveErrorToDatabase(message: string, meta: any[]): Promise<void> {
  try {
    const metadata = {
      message,
      meta: meta.length > 0 ? meta : null,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };

    const tableExists = await checkTableExists();
    if (!tableExists) return;

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [null, 'Erro crítico do sistema', JSON.stringify(metadata)]
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 [ERROR_LOG] Erro salvo no banco: ${message}`);
    }
  } catch (err: any) {
    console.error('⚠️ Falha ao salvar erro no banco:', err.message);
  }
}

/**
 * ✅ Sobrescreve logger.error com compatibilidade total de tipos
 */
const originalError: winston.LeveledLogMethod = logger.error.bind(logger);

logger.error = ((message: any, ...meta: any[]) => {
  const msg = message instanceof Error ? message.message : String(message);

  // log original do Winston
  originalError(msg, ...meta);

  // grava no banco de forma assíncrona
  saveErrorToDatabase(msg, meta).catch((err) =>
    console.error('⚠️ Erro ao persistir log no banco:', err.message)
  );
}) as winston.LeveledLogMethod;

/**
 * ✅ Log de erros com contexto de usuário
 */
export async function logErrorWithUser(
  userId: string | null,
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  const msg = error.message || 'Erro desconhecido';
  logger.error(msg, { userId, context, stack: error.stack });

  try {
    const tableExists = await checkTableExists();
    if (!tableExists) return;

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [
        userId,
        'Erro na operação do usuário',
        JSON.stringify({
          message: msg,
          stack: error.stack,
          context,
          userId,
          timestamp: new Date().toISOString(),
        }),
      ]
    );
  } catch (dbError: any) {
    console.error('⚠️ Erro ao salvar log de erro no banco:', dbError.message);
  }
}
