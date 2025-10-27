// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'sales_gamification',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('🔌 Pool PostgreSQL encerrado');
  process.exit(0);
});
