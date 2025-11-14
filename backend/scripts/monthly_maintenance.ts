/**
 * Script de manutenção mensal - Executar no 1º dia de cada mês
 * 
 * Este script faz:
 * 1. Reset dos contadores mensais (contratos e kW)
 * 2. Verificação de rebaixamento por não bater meta
 * 3. Geração de relatórios mensais
 * 
 * Para executar manualmente:
 * npm run monthly-maintenance
 * 
 * Para agendar (crontab):
 * 0 0 1 * * cd /path/to/backend && npm run monthly-maintenance
 */

import { pool } from '../src/config/database';
import { monthlyTargetService } from '../src/services/monthlyTarget.service';

async function runMonthlyMaintenance() {
  console.log('\n🗓️  INÍCIO DA MANUTENÇÃO MENSAL\n');
  console.log(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log('=' .repeat(60));

  try {
    // 1. Verificar metas do mês anterior
    console.log('\n1️⃣  Verificando metas do mês anterior...');
    const checkResults = await monthlyTargetService.checkAllUsersTargets();
    
    console.log(`\n   ✅ ${checkResults.length} usuários verificados`);
    
    const penalizedUsers = checkResults.filter((r: any) => r.willLosePoints);
    const achievedUsers = checkResults.filter((r: any) => r.achievedTarget);
    const belowTargetUsers = checkResults.filter((r: any) => !r.achievedTarget && !r.willLosePoints);
    
    if (penalizedUsers.length > 0) {
      console.log(`\n   ⚠️  ${penalizedUsers.length} usuário(s) PERDERAM PONTOS (3 meses sem meta):`);
      penalizedUsers.forEach((u: any) => {
        console.log(`      - ${u.name} (${u.email}) - ${u.monthsBelowTarget} meses abaixo da meta`);
      });
    }
    
    if (belowTargetUsers.length > 0) {
      console.log(`\n   ⚠️  ${belowTargetUsers.length} usuário(s) abaixo da meta:`);
      belowTargetUsers.forEach((u: any) => {
        console.log(`      - ${u.name} (${u.email}) - ${u.monthsBelowTarget} mês(es) abaixo`);
      });
    }
    
    if (achievedUsers.length > 0) {
      console.log(`\n   ✅ ${achievedUsers.length} usuário(s) bateram meta`);
    }

    // 2. Resetar contadores mensais
    console.log('\n2️⃣  Resetando contadores mensais...');
    const resetUsers = await monthlyTargetService.resetMonthlyCounters();
    console.log(`   ✅ ${resetUsers.length} usuário(s) resetados`);

    // 3. Gerar relatório de premiações pendentes
    console.log('\n3️⃣  Verificando premiações pendentes...');
    const pendingRewards = await pool.query(`
      SELECT 
        reward_type,
        COUNT(*) as total,
        array_agg(DISTINCT u.name) as users
      FROM special_rewards sr
      JOIN users u ON u.id = sr.user_id
      WHERE sr.delivered = false
      GROUP BY reward_type
    `);

    if (pendingRewards.rowCount && pendingRewards.rowCount > 0) {
      console.log('\n   🎁 Premiações pendentes de entrega:');
      pendingRewards.rows.forEach((reward: any) => {
        console.log(`      - ${reward.reward_type}: ${reward.total} prêmio(s)`);
      });
    } else {
      console.log('   ✅ Nenhuma premiação pendente');
    }

    // 4. Gerar relatório de bônus pendentes
    console.log('\n4️⃣  Verificando bônus pendentes de pagamento...');
    const pendingBonuses = await pool.query(`
      SELECT 
        to_level,
        COUNT(*) as total,
        SUM(bonus_amount) as total_amount,
        array_agg(u.name) as users
      FROM advancement_bonuses ab
      JOIN users u ON u.id = ab.user_id
      WHERE ab.paid = false
      GROUP BY to_level
    `);

    if (pendingBonuses.rowCount && pendingBonuses.rowCount > 0) {
      console.log('\n   💰 Bônus pendentes de pagamento:');
      let grandTotal = 0;
      pendingBonuses.rows.forEach((bonus: any) => {
        const amount = parseFloat(bonus.total_amount);
        grandTotal += amount;
        console.log(`      - ${bonus.to_level}: R$ ${amount.toFixed(2)} (${bonus.total} usuário(s))`);
      });
      console.log(`\n   💵 Total a pagar: R$ ${grandTotal.toFixed(2)}`);
    } else {
      console.log('   ✅ Nenhum bônus pendente');
    }

    // 5. Estatísticas gerais
    console.log('\n5️⃣  Estatísticas gerais:');
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.is_active THEN u.id END) as active_users,
        COUNT(DISTINCT s.id) as total_sales_month,
        SUM(s.kilowatts) as total_kilowatts_month,
        SUM(s.value) as total_revenue_month
      FROM users u
      LEFT JOIN sales s ON s.user_id = u.id 
        AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND s.created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);

    const statsData = stats.rows[0];
    console.log(`   👥 Total de usuários: ${statsData.total_users}`);
    console.log(`   ✅ Usuários ativos: ${statsData.active_users}`);
    console.log(`   📊 Vendas no mês: ${statsData.total_sales_month || 0}`);
    console.log(`   ⚡ kW total: ${parseFloat(statsData.total_kilowatts_month || 0).toFixed(2)}`);
    console.log(`   💵 Faturamento: R$ ${parseFloat(statsData.total_revenue_month || 0).toFixed(2)}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ MANUTENÇÃO MENSAL CONCLUÍDA COM SUCESSO!\n');

  } catch (error) {
    console.error('\n❌ ERRO NA MANUTENÇÃO MENSAL:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar
runMonthlyMaintenance()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script falhou:', error);
    process.exit(1);
  });
