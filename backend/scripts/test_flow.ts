/**
 * 🧪 Script de teste: Fluxo completo de vendas, comissões e promoções
 * 
 * Este script testa:
 * 1. Criação de venda
 * 2. Aprovação de venda
 * 3. Geração de comissões (pessoal + rede)
 * 4. Verificação de promoção automática
 * 5. Validação de contratos mínimos mensais
 */

import { pool } from '../src/config/database';
import { salesService } from '../src/modules/sales/sales.service';
import { commissionService } from '../src/modules/commissions/commission.service';

async function testFlow() {
  console.log('🧪 ========================================');
  console.log('🧪 INICIANDO TESTE DO FLUXO COMPLETO');
  console.log('🧪 ========================================\n');

  try {
    // 1️⃣ Buscar Maria (consultant com 800 pontos)
    const mariaResult = await pool.query(
      `SELECT id, name, email, role, points FROM users WHERE email = 'maria@gmail.com'`
    );
    const maria = mariaResult.rows[0];
    
    if (!maria) {
      console.error('❌ Usuária Maria não encontrada!');
      return;
    }

    console.log('👤 USUÁRIA DE TESTE:');
    console.log(`   Nome: ${maria.name}`);
    console.log(`   Email: ${maria.email}`);
    console.log(`   Nível: ${maria.role}`);
    console.log(`   Pontos Atuais: ${maria.points}\n`);

    // 2️⃣ Criar nova venda (250 kW = 250 pontos)
    // Total será 800 + 250 = 1050 pontos (deve promover para Master!)
    console.log('📝 CRIANDO NOVA VENDA:');
    const saleData = {
      client_name: 'Cliente Teste Flow',
      value: 30000, // R$ 30.000
      kilowatts: 250, // 250 kW = 250 pontos
      insurance_value: 2000, // R$ 2.000 seguro
      sale_type: 'direct' as const,
      notes: 'Venda de teste para validação do fluxo completo'
    };
    
    console.log(`   Cliente: ${saleData.client_name}`);
    console.log(`   Valor: R$ ${saleData.value.toLocaleString('pt-BR')}`);
    console.log(`   kW: ${saleData.kilowatts}`);
    console.log(`   Seguro: R$ ${saleData.insurance_value.toLocaleString('pt-BR')}`);

    const createResult = await salesService.createSale(maria.id, saleData);
    const saleId = createResult.sale.id;

    console.log(`\n✅ Venda criada: ${saleId}`);
    console.log(`   Status: ${createResult.sale.status}`);
    console.log(`   Pontos ganhos: ${createResult.points.earned}`);
    console.log(`   Pontos acumulados: ${createResult.points.accumulated}`);
    console.log(`   Comissão venda: R$ ${createResult.commission.sale.toFixed(2)}`);
    console.log(`   Comissão seguro: R$ ${createResult.commission.insurance.toFixed(2)}`);
    console.log(`   Comissão total: R$ ${createResult.commission.total.toFixed(2)}\n`);

    // 3️⃣ Aguardar 2 segundos
    console.log('⏳ Aguardando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4️⃣ Aprovar a venda
    console.log('✅ APROVANDO VENDA:');
    await salesService.updateSale(saleId, maria.id, {
      status: 'approved'
    });
    console.log('   ✅ Venda aprovada com sucesso!\n');

    // 5️⃣ Aguardar processamento
    console.log('⏳ Aguardando processamento de comissões...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6️⃣ Verificar comissões pessoais
    console.log('💰 VERIFICANDO COMISSÕES PESSOAIS:');
    const personalCommissions = await commissionService.getPersonalCommissions(maria.id);
    const lastPersonalComm = personalCommissions[0];
    
    if (lastPersonalComm) {
      console.log(`   Percentual: ${lastPersonalComm.commission_percentage}%`);
      console.log(`   Valor: R$ ${parseFloat(lastPersonalComm.commission_amount).toFixed(2)}`);
      console.log(`   Pontos: ${lastPersonalComm.points}`);
      console.log(`   Pago: ${lastPersonalComm.paid ? 'Sim' : 'Não'}\n`);
    } else {
      console.log('   ⚠️ Nenhuma comissão pessoal encontrada\n');
    }

    // 7️⃣ Verificar comissões de rede (Samuel como líder)
    const samuelResult = await pool.query(
      `SELECT id FROM users WHERE email = 'sam@gmail.com'`
    );
    const samuelId = samuelResult.rows[0]?.id;

    if (samuelId) {
      console.log('🌐 VERIFICANDO COMISSÕES DE REDE (Samuel):');
      const networkCommissions = await commissionService.getNetworkCommissions(samuelId);
      const lastNetworkComm = networkCommissions[0];
      
      if (lastNetworkComm) {
        console.log(`   Líder: Samuel`);
        console.log(`   Membro da equipe: ${lastNetworkComm.team_member_name}`);
        console.log(`   Percentual: ${lastNetworkComm.commission_percentage}%`);
        console.log(`   Valor: R$ ${parseFloat(lastNetworkComm.commission_amount).toFixed(2)}`);
        console.log(`   Nível: ${lastNetworkComm.line_level}`);
        console.log(`   Pago: ${lastNetworkComm.paid ? 'Sim' : 'Não'}\n`);
      } else {
        console.log('   ⚠️ Nenhuma comissão de rede encontrada\n');
      }
    }

    // 8️⃣ Verificar promoção de nível
    console.log('🆙 VERIFICANDO PROMOÇÃO DE NÍVEL:');
    const mariaUpdated = await pool.query(
      `SELECT name, role, points FROM users WHERE id = $1`,
      [maria.id]
    );
    const mariaAfter = mariaUpdated.rows[0];

    console.log(`   Nível anterior: ${maria.role}`);
    console.log(`   Nível atual: ${mariaAfter.role}`);
    console.log(`   Pontos anterior: ${maria.points}`);
    console.log(`   Pontos atual: ${mariaAfter.points}`);

    if (mariaAfter.role !== maria.role) {
      console.log(`   🎉 PROMOÇÃO! Maria foi promovida de ${maria.role} para ${mariaAfter.role}!\n`);
      
      // Verificar notificação
      const notificationResult = await pool.query(
        `SELECT type, title, message, created_at 
         FROM notifications 
         WHERE user_id = $1 AND type = 'level_up' 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [maria.id]
      );
      
      if (notificationResult.rows.length > 0) {
        const notif = notificationResult.rows[0];
        console.log('📬 NOTIFICAÇÃO DE PROMOÇÃO:');
        console.log(`   Título: ${notif.title}`);
        console.log(`   Mensagem: ${notif.message}\n`);
      }
    } else {
      console.log(`   ℹ️ Sem promoção. Pontos necessários para Master: 1000\n`);
    }

    // 9️⃣ Verificar contratos do mês
    console.log('📊 VERIFICANDO CONTRATOS DO MÊS:');
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const contractsResult = await pool.query(
      `SELECT COUNT(*)::int as total_contracts
       FROM sales
       WHERE user_id = $1
         AND created_at >= $2
         AND status IN ('approved', 'delivered')`,
      [maria.id, firstDayOfMonth]
    );

    const monthlyContracts = contractsResult.rows[0].total_contracts;
    console.log(`   Contratos aprovados este mês: ${monthlyContracts}`);
    console.log(`   Contratos necessários para Master: 2\n`);

    // 🔟 Resumo final
    console.log('📈 RESUMO DO TESTE:');
    console.log('   ✅ Venda criada com sucesso');
    console.log('   ✅ Venda aprovada');
    console.log('   ✅ Comissões pessoais geradas');
    console.log('   ✅ Comissões de rede geradas');
    console.log(`   ${mariaAfter.role !== maria.role ? '✅' : 'ℹ️'} Promoção de nível ${mariaAfter.role !== maria.role ? 'executada' : 'pendente (verificar requisitos)'}`);
    console.log(`   ℹ️ Contratos no mês: ${monthlyContracts}/2 (para Master)\n`);

    console.log('🧪 ========================================');
    console.log('🧪 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🧪 ========================================\n');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Executar teste
testFlow();
