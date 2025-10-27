// backend/src/database/seed.ts
import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const runSeeds = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Executando seeds...\n');

    const seedsDir = path.join(__dirname, 'seeds');
    
    if (!fs.existsSync(seedsDir)) {
      console.log('⚠️  Pasta de seeds não encontrada');
      return;
    }

    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`   Executando: ${file}`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`   ✅ ${file} concluído\n`);
    }

    console.log('✅ Todos os seeds foram executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runSeeds();
