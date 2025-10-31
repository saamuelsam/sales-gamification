// backend/src/database/migrate.ts
import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const runMigrations = async () => {
  console.log('🔹 DB_HOST configurado:', process.env.DB_HOST); // Log para debugs
  console.log('🔹 Host atual no pool:', pool.options.host);
  const client = await pool.connect();

  try {
    console.log('🚀 Executando migrations...\n');

    // Habilitar extensão ltree para hierarquia
    await client.query('CREATE EXTENSION IF NOT EXISTS ltree;');
    console.log('✅ Extensão ltree habilitada\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  Pasta de migrations não encontrada');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`   Executando: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`   ✅ ${file} concluído\n`);
    }

    console.log('✅ Todas as migrations foram executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations();
