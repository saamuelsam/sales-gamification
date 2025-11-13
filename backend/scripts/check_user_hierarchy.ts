import { pool } from '../src/config/database';

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_name='user_hierarchy'
    `);
    
    console.log('✅ user_hierarchy exists:', result.rows.length > 0);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Tabela user_hierarchy NÃO existe! Executando migration...');
      
      // Executar migration
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, '../src/database/migrations/021_create_user_hierarchy.sql');
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await pool.query(sql);
      console.log('✅ Migration 021_create_user_hierarchy.sql executada com sucesso!');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTable();
