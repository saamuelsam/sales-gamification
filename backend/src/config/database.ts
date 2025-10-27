// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'sales_gamification_db',  // Atualizado para nome do Render
  user: process.env.DB_USER || 'postgres',  // Fallback genérico, mas force via env
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },  // Obrigatório para Render/DigitalOcean
  max: 20,  // Bom para apps médios; aumente para 50 se alta concorrência [web:40]
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,  // Aumentado para conexões externas lentas
});

export const verifyConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL conectado com sucesso');
    client.release();
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error);
    process.exit(1);
  }
};

// Graceful shutdown (permanece igual, bom para Render)
process.on('SIGINT', async () => {
  await pool.end();
  console.log('🔌 Pool PostgreSQL encerrado');
  process.exit(0);
});
