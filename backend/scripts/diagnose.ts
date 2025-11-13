#!/usr/bin/env node
/**
 * 🔍 Script de Diagnóstico de Comissões
 * Executa queries para identificar problemas no fluxo de comissões
 */

import { pool } from '../src/config/database.js';

async function diagnose() {
  console.log('\n🔍 INICIANDO DIAGNÓSTICO DE COMISSÕES...\n');

  try {
    // 1. Vendas por status
    console.log('📊 1️⃣ VENDAS POR STATUS:');
    const salesStatus = await pool.query(
      `SELECT status, COUNT(*) as total, SUM(value) as total_value
       FROM sales
       GROUP BY status
       ORDER BY status`
    );
    console.table(salesStatus.rows);

    // 2. Vendas recentes
    console.log('\n📋 2️⃣ ÚLTIMAS 10 VENDAS:');
    const recentSales = await pool.query(
      `SELECT id, user_id, client_name, value, kilowatts, status, created_at
       FROM sales
       ORDER BY created_at DESC
       LIMIT 10`
    );
    console.table(recentSales.rows);

    // 3. Comissões pessoais
    console.log('\n💵 3️⃣ COMISSÕES PESSOAIS (RESUMO):');
    const personalSummary = await pool.query(
      `SELECT 
         COUNT(*) as total_records,
         COUNT(DISTINCT user_id) as unique_users,
         COUNT(DISTINCT sale_id) as unique_sales,
         SUM(commission_amount) as total_amount
       FROM personal_commissions`
    );
    console.table(personalSummary.rows);

    // 4. Comissões de rede
    console.log('\n🌐 4️⃣ COMISSÕES DE REDE (RESUMO):');
    const networkSummary = await pool.query(
      `SELECT 
         COUNT(*) as total_records,
         COUNT(DISTINCT leader_id) as unique_leaders,
         COUNT(DISTINCT team_member_id) as unique_members,
         SUM(commission_amount) as total_amount
       FROM network_commissions`
    );
    console.table(networkSummary.rows);

    // 5. Comissões pessoais detalhadas
    console.log('\n💵 5️⃣ ÚLTIMOS REGISTROS EM PERSONAL_COMMISSIONS:');
    const personalDetails = await pool.query(
      `SELECT id, user_id, sale_id, commission_amount, created_at
       FROM personal_commissions
       ORDER BY created_at DESC
       LIMIT 10`
    );
    if (personalDetails.rows.length === 0) {
      console.log('❌ NENHUM REGISTRO ENCONTRADO');
    } else {
      console.table(personalDetails.rows);
    }

    // 6. Comissões de rede detalhadas
    console.log('\n🌐 6️⃣ ÚLTIMOS REGISTROS EM NETWORK_COMMISSIONS:');
    const networkDetails = await pool.query(
      `SELECT id, leader_id, team_member_id, sale_id, commission_amount, created_at
       FROM network_commissions
       ORDER BY created_at DESC
       LIMIT 10`
    );
    if (networkDetails.rows.length === 0) {
      console.log('❌ NENHUM REGISTRO ENCONTRADO');
    } else {
      console.table(networkDetails.rows);
    }

    // 7. Hierarquia de usuários
    console.log('\n👥 7️⃣ HIERARQUIA DE USUÁRIOS (USER_HIERARCHY):');
    const hierarchy = await pool.query(
      `SELECT id, leader_id, subordinate_id, line_level, created_at
       FROM user_hierarchy
       ORDER BY created_at DESC
       LIMIT 10`
    );
    if (hierarchy.rows.length === 0) {
      console.log('❌ NENHUMA HIERARQUIA CONFIGURADA');
    } else {
      console.table(hierarchy.rows);
    }

    // 8. Usuários
    console.log('\n👤 8️⃣ USUÁRIOS:');
    const users = await pool.query(
      `SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT 10`
    );
    console.table(users.rows);

    // 9. Verificar se há vendas aprovadas sem comissões
    console.log('\n⚠️  9️⃣ VENDAS APROVADAS SEM COMISSÕES PESSOAIS:');
    const missingPersonal = await pool.query(
      `SELECT s.id, s.user_id, s.client_name, s.value, s.created_at
       FROM sales s
       WHERE s.status IN ('approved', 'delivered')
         AND NOT EXISTS (
           SELECT 1 FROM personal_commissions pc WHERE pc.sale_id = s.id
         )
       ORDER BY s.created_at DESC
       LIMIT 10`
    );
    if (missingPersonal.rows.length === 0) {
      console.log('✅ TODAS AS VENDAS APROVADAS TÊM COMISSÕES PESSOAIS');
    } else {
      console.log(`❌ ${missingPersonal.rows.length} VENDAS APROVADAS SEM COMISSÕES PESSOAIS:`);
      console.table(missingPersonal.rows);
    }

    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO\n');
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

diagnose();
