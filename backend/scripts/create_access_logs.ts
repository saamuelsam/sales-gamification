import { pool } from '../src/config/database';

async function createAccessLogs() {
  try {
    console.log('🔐 Criando logs de acesso...');
    
    const usersResult = await pool.query('SELECT id FROM users LIMIT 3');
    const userIds = usersResult.rows.map(r => r.id);
    
    if (userIds.length === 0) {
      console.error('❌ Nenhum usuário encontrado');
      process.exit(1);
    }

    const actions = ['login', 'logout'];
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.10', '192.168.2.200'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.2',
      'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0'
    ];

    for (let i = 0; i < 15; i++) {
      const userId = userIds[i % userIds.length];
      const action = actions[i % actions.length];
      const ip = ips[i % ips.length];
      const userAgent = userAgents[i % userAgents.length];
      
      await pool.query(
        'INSERT INTO login_logs(user_id, action, ip_address, user_agent) VALUES($1, $2, $3, $4)',
        [userId, action, ip, userAgent]
      );
    }

    console.log('✅ 15 logs de acesso criados com sucesso');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao criar logs:', error.message);
    process.exit(1);
  }
}

createAccessLogs();
