import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Monta a connection string a partir de DATABASE_URL ou variáveis DB_*
const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${encodeURIComponent(process.env.DB_USER || process.env.POSTGRES_USER || 'admin')}:${encodeURIComponent(process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'admin123')}@${process.env.DB_HOST || 'postgres'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || process.env.POSTGRES_DB || 'sales_gamification'}`;

// Suporte SSL opcional (útil para provedores gerenciados). Ative com DB_SSL=true
const sslOption = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({
  connectionString,
  ssl: sslOption,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10s
});

// Função para verificar conexão com retry
export const verifyConnection = async (retries = 5, delay = 3000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ PostgreSQL conectado com sucesso');
      return;
    } catch (error) {
      console.log(`⏳ Tentativa ${i + 1}/${retries} - Aguardando PostgreSQL...`);
      if (i === retries - 1) {
        console.error('❌ Erro ao conectar PostgreSQL:', error);
        throw error;
      }
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Event listeners
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no PostgreSQL:', err);
});

pool.on('connect', () => {
  console.log('🔗 Nova conexão estabelecida com PostgreSQL');
});
