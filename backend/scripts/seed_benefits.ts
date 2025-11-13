#!/usr/bin/env tsx
/**
 * 🎁 Script para popular benefícios no banco de dados
 * Executa o seed SQL automaticamente
 */

import { pool } from '../src/config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function seedBenefits() {
  console.log('🎁 Iniciando seed de benefícios...\n');

  try {
    // Ler arquivo SQL
    const sqlPath = join(__dirname, '../src/database/seeds/003_insert_benefits.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Executar SQL
    await pool.query(sql);

    // Verificar resultados
    const result = await pool.query(`
      SELECT 
        l.name as nivel,
        l.phase_number,
        COUNT(b.id) as total_beneficios
      FROM levels l
      LEFT JOIN benefits b ON b.level_id = l.id
      GROUP BY l.id, l.name, l.phase_number
      ORDER BY l.phase_number
    `);

    console.log('✅ Seed executado com sucesso!\n');
    console.log('📊 Resumo dos benefícios por nível:\n');
    console.table(result.rows);

    const totalBenefits = result.rows.reduce((sum, row) => sum + parseInt(row.total_beneficios), 0);
    console.log(`\n🎉 Total de ${totalBenefits} benefícios criados!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

seedBenefits();
