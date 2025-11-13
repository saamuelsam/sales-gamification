import { pool } from '../src/config/database';

async function createTestCommissions() {
  try {
    console.log('💰 Criando comissões de teste...');
    
    // Buscar usuários
    const usersResult = await pool.query('SELECT id, name FROM users LIMIT 5');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.error('❌ Nenhum usuário encontrado');
      process.exit(1);
    }

    console.log(`✅ ${users.length} usuários encontrados`);

    // Buscar vendas existentes
    const salesResult = await pool.query('SELECT id, kilowatts FROM sales LIMIT 10');
    const sales = salesResult.rows;

    console.log(`✅ ${sales.length} vendas encontradas`);

    // Criar comissões pessoais
    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length];
      const sale = sales[i % sales.length];
      const percentage = 5 + (i % 3) * 2; // 5%, 7%, 9%
      const saleValue = 10000 + (i * 1000);
      const commissionAmount = (saleValue * percentage) / 100;
      const points = sale?.kilowatts || 50;
      const paid = i % 3 === 0; // 33% pagas

      await pool.query(
        `INSERT INTO personal_commissions 
        (user_id, sale_id, commission_percentage, commission_amount, points, paid, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${i} days')
        ON CONFLICT (user_id, sale_id) DO NOTHING`,
        [user.id, sale?.id, percentage, commissionAmount, points, paid]
      );
    }

    console.log('✅ 15 comissões pessoais criadas');

    // Criar comissões de rede
    for (let i = 0; i < 10; i++) {
      const leader = users[0]; // Primeiro usuário é o líder
      const member = users[(i % (users.length - 1)) + 1];
      const sale = sales[i % sales.length];
      const percentage = 3 + (i % 2); // 3% ou 4%
      const saleValue = 8000 + (i * 800);
      const commissionAmount = (saleValue * percentage) / 100;
      const lineLevel = 1;
      const paid = i % 4 === 0; // 25% pagas

      await pool.query(
        `INSERT INTO network_commissions 
        (leader_id, team_member_id, sale_id, commission_percentage, commission_amount, line_level, paid, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${i * 2} days')
        ON CONFLICT (leader_id, team_member_id, sale_id) DO NOTHING`,
        [leader.id, member.id, sale?.id, percentage, commissionAmount, lineLevel, paid]
      );
    }

    console.log('✅ 10 comissões de rede criadas');

    // Verificar totais
    const personalTotal = await pool.query(
      'SELECT COUNT(*) as total, SUM(commission_amount) as sum FROM personal_commissions'
    );
    const networkTotal = await pool.query(
      'SELECT COUNT(*) as total, SUM(commission_amount) as sum FROM network_commissions'
    );

    console.log('\n📊 RESUMO:');
    console.log(`   Comissões Pessoais: ${personalTotal.rows[0].total} (R$ ${parseFloat(personalTotal.rows[0].sum || 0).toFixed(2)})`);
    console.log(`   Comissões de Rede: ${networkTotal.rows[0].total} (R$ ${parseFloat(networkTotal.rows[0].sum || 0).toFixed(2)})`);
    console.log('\n✅ Dados de teste criados com sucesso!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao criar comissões:', error.message);
    process.exit(1);
  }
}

createTestCommissions();
