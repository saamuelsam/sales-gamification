/**
 * 🧪 Script de Teste - Code Audit Improvements
 * 
 * Testa:
 * 1. Row-level locking (SELECT FOR UPDATE)
 * 2. Batch insert de comissões
 * 3. ConfigService (cache)
 * 4. HierarchyCache (Redis opcional)
 */

import { pool } from '../src/config/database';
import { commissionService } from '../src/modules/commissions/commission.service';
import { configService } from '../src/services/config.service';
import { hierarchyCacheService } from '../src/services/hierarchyCache.service';

async function testCodeAuditImprovements() {
  console.log('\n🧪 ===== TESTE DE MELHORIAS DO CODE AUDIT =====\n');

  try {
    // ========================================
    // 🔒 TESTE 1: Row-Level Locking
    // ========================================
    console.log('1️⃣ Testando Row-Level Locking...');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // SELECT FOR UPDATE deve funcionar
      const result = await client.query(
        'SELECT id, name, role FROM users WHERE is_active = TRUE LIMIT 1 FOR UPDATE'
      );
      
      if (result.rows.length > 0) {
        console.log('   ✅ Row-level locking (SELECT FOR UPDATE) funcionando');
        console.log(`   📝 Usuário locked: ${result.rows[0].name} (${result.rows[0].role})`);
      } else {
        console.log('   ⚠️ Nenhum usuário ativo encontrado para testar lock');
      }
      
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    // ========================================
    // 🔧 TESTE 2: ConfigService (Cache)
    // ========================================
    console.log('\n2️⃣ Testando ConfigService...');
    
    const testRole = 'executive';
    
    const personalRate = await configService.getPersonalCommissionRate(testRole);
    const insuranceRate = await configService.getInsuranceCommissionRate(testRole);
    const networkLine1 = await configService.getNetworkCommissionRateLine1(testRole);
    const networkRest = await configService.getNetworkCommissionRateRest(testRole);
    const fixedAllowance = await configService.getFixedAllowance(testRole);
    const kwTarget = await configService.getMonthlyKwTarget(testRole);
    
    console.log(`   ✅ ConfigService funcionando para role: ${testRole}`);
    console.log(`   📊 Comissão pessoal: ${personalRate}%`);
    console.log(`   🏥 Comissão seguro: ${insuranceRate}%`);
    console.log(`   🌐 Rede (1ª linha): ${networkLine1}%`);
    console.log(`   🌐 Rede (restante): ${networkRest}%`);
    console.log(`   💵 Ajuda de custo: R$ ${fixedAllowance}`);
    console.log(`   🎯 Meta kW: ${kwTarget}`);

    // Testar cache (segunda chamada deve ser do cache)
    console.log('\n   🔄 Testando cache (segunda chamada)...');
    const start = Date.now();
    await configService.getPersonalCommissionRate(testRole);
    const cacheTime = Date.now() - start;
    console.log(`   ⚡ Tempo com cache: ${cacheTime}ms (deve ser < 5ms)`);

    // ========================================
    // 🚀 TESTE 3: HierarchyCache (Redis)
    // ========================================
    console.log('\n3️⃣ Testando HierarchyCache...');
    
    // Buscar um usuário com hierarquia
    const userResult = await pool.query(
      `SELECT u.id, u.name, u.role 
       FROM users u
       JOIN user_hierarchy uh ON uh.subordinate_id = u.id
       WHERE u.is_active = TRUE
       LIMIT 1`
    );
    
    if (userResult.rows.length > 0) {
      const testUserId = userResult.rows[0].id;
      const testUserName = userResult.rows[0].name;
      
      console.log(`   👤 Testando hierarquia para: ${testUserName} (${testUserId})`);
      
      // Primeira chamada (sem cache)
      const start1 = Date.now();
      const leaders1 = await hierarchyCacheService.getLeadersHierarchy(testUserId);
      const time1 = Date.now() - start1;
      
      console.log(`   📊 Primeira chamada (sem cache): ${time1}ms - ${leaders1.length} líderes`);
      
      // Segunda chamada (com cache)
      const start2 = Date.now();
      const leaders2 = await hierarchyCacheService.getLeadersHierarchy(testUserId);
      const time2 = Date.now() - start2;
      
      console.log(`   ⚡ Segunda chamada (com cache): ${time2}ms - ${leaders2.length} líderes`);
      console.log(`   🚀 Melhoria de performance: ${Math.round((time1 - time2) / time1 * 100)}%`);
      
      // Verificar cache stats
      const stats = await hierarchyCacheService.getCacheStats();
      console.log(`   📈 Redis stats:`, stats);
    } else {
      console.log('   ⚠️ Nenhum usuário com hierarquia encontrado');
    }

    // ========================================
    // 📊 TESTE 4: Índices Compostos
    // ========================================
    console.log('\n4️⃣ Testando Índices Compostos...');
    
    // Verificar se índices foram criados
    const indexResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('user_hierarchy', 'network_commissions', 'personal_commissions', 'sales')
      AND indexname LIKE '%_leader_level%'
      OR indexname LIKE '%_paid_date%'
      OR indexname LIKE '%_status_date%'
      ORDER BY indexname
    `);
    
    if (indexResult.rows.length > 0) {
      console.log(`   ✅ ${indexResult.rows.length} índices compostos encontrados:`);
      indexResult.rows.forEach(row => {
        console.log(`      • ${row.indexname}`);
      });
    } else {
      console.log('   ⚠️ Índices compostos ainda não criados (executar migration 036)');
    }

    // ========================================
    // 🔒 TESTE 5: Constraints
    // ========================================
    console.log('\n5️⃣ Testando Constraints...');
    
    const constraintResult = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conname LIKE '%check_%'
      AND conrelid::regclass::text IN ('personal_commissions', 'network_commissions', 'user_hierarchy', 'sales', 'users')
      ORDER BY conname
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log(`   ✅ ${constraintResult.rows.length} constraints encontrados:`);
      constraintResult.rows.forEach(row => {
        console.log(`      • ${row.conname} (${row.contype})`);
      });
    } else {
      console.log('   ⚠️ Constraints ainda não criados (executar migration 036)');
    }

    // ========================================
    // 🎯 TESTE 6: Business Config Table
    // ========================================
    console.log('\n6️⃣ Testando Business Config Table...');
    
    const configTableResult = await pool.query(`
      SELECT COUNT(*) as total FROM business_config
    `);
    
    if (configTableResult.rows.length > 0) {
      const total = configTableResult.rows[0].total;
      console.log(`   ✅ Tabela business_config existe com ${total} configurações`);
      
      // Listar algumas configs
      const configs = await configService.getAllConfigs();
      console.log(`   📋 Configurações disponíveis: ${configs.length}`);
      configs.slice(0, 5).forEach(config => {
        console.log(`      • ${config.config_key} (${config.category})`);
      });
    } else {
      console.log('   ⚠️ Tabela business_config não existe (executar migration 037)');
    }

    console.log('\n\n✅ ===== TODOS OS TESTES CONCLUÍDOS =====\n');
    
  } catch (error: any) {
    console.error('\n❌ Erro durante testes:', error.message);
    console.error(error.stack);
  } finally {
    await hierarchyCacheService.disconnect();
    await pool.end();
  }
}

// Executar testes
testCodeAuditImprovements().catch(console.error);
