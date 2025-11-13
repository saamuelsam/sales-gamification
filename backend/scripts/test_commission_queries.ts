import { pool } from '../src/config/database';

async function testQueries() {
  try {
    console.log('🔍 Testando queries de comissões...\n');
    
    // Buscar primeiro usuário
    const userResult = await pool.query('SELECT id, name FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].id;
    const userName = userResult.rows[0].name;
    console.log(`✅ Testando com usuário: ${userName} (${userId})\n`);
    
    // Testar query de comissões pessoais
    console.log('1️⃣ Testando comissões pessoais...');
    const personalQuery = `
      SELECT 
        pc.id, pc.sale_id, pc.commission_percentage, pc.commission_amount, pc.points,
        pc.paid, pc.paid_at, pc.created_at,
        s.value AS sale_value,
        c.name AS client_name
       FROM personal_commissions pc
       LEFT JOIN sales s ON pc.sale_id = s.id
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE pc.user_id = $1
       ORDER BY pc.created_at DESC
    `;
    
    const personalResult = await pool.query(personalQuery, [userId]);
    console.log(`   ✅ ${personalResult.rows.length} comissões pessoais encontradas\n`);
    
    // Testar query de comissões de rede
    console.log('2️⃣ Testando comissões de rede...');
    const networkQuery = `
      SELECT 
        nc.id, nc.sale_id, nc.commission_percentage, nc.commission_amount,
        nc.line_level, nc.paid, nc.paid_at, nc.created_at,
        u.name AS team_member_name, u.email AS team_member_email,
        s.value AS sale_value,
        c.name AS client_name
       FROM network_commissions nc
       JOIN users u ON nc.team_member_id = u.id
       LEFT JOIN sales s ON nc.sale_id = s.id
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE nc.leader_id = $1
       ORDER BY nc.created_at DESC
    `;
    
    const networkResult = await pool.query(networkQuery, [userId]);
    console.log(`   ✅ ${networkResult.rows.length} comissões de rede encontradas\n`);
    
    // Testar query de resumo mensal
    console.log('3️⃣ Testando resumo mensal...');
    const monthlyQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(commission_amount), 0)::float AS amount
       FROM personal_commissions
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month ASC
    `;
    
    const monthlyResult = await pool.query(monthlyQuery, [userId]);
    console.log(`   ✅ ${monthlyResult.rows.length} meses com comissões\n`);
    
    console.log('✅ Todas as queries funcionam corretamente!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testQueries();
