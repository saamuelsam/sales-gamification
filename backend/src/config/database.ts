// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // URI completa do Postgres
  ssl: { rejectUnauthorized: false },         // TLS para provedores gerenciados
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
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

process.on('SIGINT', async () => {
  await pool.end();
  console.log('🔌 Pool PostgreSQL encerrado');
  process.exit(0);
});
