// backend/src/modules/admin/admin.service.ts
import { pool } from '@config/database';
import { logActivity, ActivityAction } from '../../utils/activityLogger';

class AdminService {
  /**
   * Estatísticas do dashboard administrativo
   */
  async getDashboardStats() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(DISTINCT leader_id) FROM user_hierarchy) as total_teams,
        (SELECT COALESCE(SUM(value), 0) FROM sales) as total_sales,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM network_commissions WHERE paid = true) as total_commissions_paid
    `);
    return result.rows[0];
  }

  
  /**
   * Listar todos os usuários
   */
  async getAllUsers() {
    const result = await pool.query(`
      SELECT id, name, email, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * ✅ Atualizar status do usuário (com log)
   */
  async updateUserStatus(userId: string, isActive: boolean, adminId: string) {
    // Buscar informações do usuário antes de atualizar
    const userInfo = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userInfo.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const userName = userInfo.rows[0].name;
    const userEmail = userInfo.rows[0].email;

    // Atualizar status
    await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2`,
      [isActive, userId]
    );

    // ✅ REGISTRAR LOG DE ATIVIDADE
    await logActivity(adminId, ActivityAction.UPDATE_USER_STATUS, {
      userId,
      userName,
      userEmail,
      newStatus: isActive ? 'ativo' : 'inativo',
      ativo: isActive,
      action: 'update_user_status',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * ✅ Atualizar role do usuário (com log)
   */
  async updateUserRole(userId: string, role: string, adminId: string) {
    // Buscar informações do usuário antes de atualizar
    const userInfo = await pool.query(
      'SELECT name, email, role as old_role FROM users WHERE id = $1',
      [userId]
    );

    if (userInfo.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const userName = userInfo.rows[0].name;
    const userEmail = userInfo.rows[0].email;
    const oldRole = userInfo.rows[0].old_role;

    // Atualizar role
    await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2`,
      [role, userId]
    );

    // ✅ REGISTRAR LOG DE ATIVIDADE
    await logActivity(adminId, ActivityAction.UPDATE_USER_ROLE, {
      userId,
      userName,
      userEmail,
      oldRole,
      newRole: role,
      novaFuncao: role,
      action: 'update_user_role',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resumo das equipes
   */
  async getTeamsSummary() {
    const result = await pool.query(`
      SELECT 
        uh.leader_id AS id,
        u.name AS leader_name,
        u.email AS leader_email,
        COUNT(DISTINCT uh.subordinate_id) AS total_members,
        COALESCE(SUM(s.value), 0) AS total_sales,
        COALESCE(SUM(p.total_points), 0) AS total_points,
        MIN(u.created_at) AS created_at
      FROM user_hierarchy uh
      JOIN users u ON u.id = uh.leader_id
      LEFT JOIN sales s ON s.user_id = uh.subordinate_id
      LEFT JOIN (
        SELECT user_id, SUM(accumulated_points) AS total_points
        FROM points
        GROUP BY user_id
      ) p ON p.user_id = uh.subordinate_id
      GROUP BY uh.leader_id, u.name, u.email
      ORDER BY total_sales DESC
    `);

    return result.rows;
  }

  /**
   * Listar todas as comissões
   */
  async getAllCommissions(status?: string, search?: string) {
    let query = `
      SELECT nc.id, 
             nc.commission_amount, 
             nc.paid, 
             nc.created_at,
             l.name as leader_name,
             m.name as team_member_name
      FROM network_commissions nc
      JOIN users l ON l.id = nc.leader_id
      JOIN users m ON m.id = nc.team_member_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status === 'paid') query += ' AND nc.paid = TRUE';
    if (status === 'unpaid') query += ' AND nc.paid = FALSE';
    if (search) {
      query += ` AND (l.name ILIKE $${params.length + 1} OR m.name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY nc.created_at DESC LIMIT 300';
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Resumo das comissões
   */
  async getCommissionsSummary() {
    const result = await pool.query(`
      SELECT 
        COUNT(*)::int as total_commissions,
        COALESCE(SUM(commission_amount), 0) as total_earned,
        COALESCE(SUM(CASE WHEN paid = TRUE THEN commission_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN paid = FALSE THEN commission_amount ELSE 0 END), 0) as total_unpaid
      FROM network_commissions
    `);
    return result.rows[0];
  }

  /**
   * ✅ Marcar comissão como paga (com log)
   */
  async markCommissionAsPaid(id: string, adminId: string) {
    // Buscar informações da comissão
    const commissionInfo = await pool.query(
      `SELECT nc.commission_amount, l.name as leader_name, m.name as member_name
       FROM network_commissions nc
       JOIN users l ON l.id = nc.leader_id
       JOIN users m ON m.id = nc.team_member_id
       WHERE nc.id = $1`,
      [id]
    );

    if (commissionInfo.rows.length === 0) {
      throw new Error('Comissão não encontrada');
    }

    const { commission_amount, leader_name, member_name } = commissionInfo.rows[0];

    // Atualizar comissão
    await pool.query(
      `UPDATE network_commissions SET paid = TRUE, paid_at = NOW() WHERE id = $1`,
      [id]
    );

    // ✅ REGISTRAR LOG DE ATIVIDADE
    await logActivity(adminId, ActivityAction.ADMIN_MARK_COMMISSION_PAID, {
      commissionId: id,
      id,
      commissionAmount: parseFloat(commission_amount),
      leaderName: leader_name,
      memberName: member_name,
      action: 'admin_mark_commission_paid',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Exportar comissões em CSV
   */
  async exportCommissionsCSV() {
    const rows = await this.getAllCommissions();
    const headers = ['Líder', 'Consultor', 'Valor', 'Status', 'Data'];
    const csvRows = [headers.join(',')];
    rows.forEach((r) => {
      csvRows.push(
        `${r.leader_name},${r.team_member_name},${r.commission_amount},"${r.paid ? 'Paga' : 'Pendente'}",${r.created_at}`
      );
    });
    return csvRows.join('\n');
  }

  /**
   * ✅ Gerar relatórios completos e detalhados do sistema
   */
  async getReports() {
    try {
      // 1. Estatísticas gerais
      const [summary] = (
        await pool.query(`
          SELECT
            (SELECT COUNT(*) FROM users WHERE is_active = true) AS active_users_count,
            (SELECT COUNT(*) FROM users) AS total_users_count,
            (SELECT COALESCE(SUM(value), 0) FROM sales WHERE date_part('month', created_at) = date_part('month', CURRENT_DATE)) AS total_sales_month,
            (SELECT COUNT(*) FROM sales WHERE date_part('month', created_at) = date_part('month', CURRENT_DATE)) AS sales_count_month,
            (SELECT COALESCE(SUM(commission_amount), 0) FROM network_commissions WHERE paid = true) AS total_commissions_paid,
            (SELECT COALESCE(SUM(commission_amount), 0) FROM network_commissions WHERE paid = false) AS total_commissions_pending
        `)
      ).rows;

      // 2. Top líder
      const topLeaderQuery = await pool.query(`
        SELECT u.id, u.name, u.email, SUM(s.value) AS total_sales, COUNT(s.id) AS sales_count
        FROM user_hierarchy uh
        JOIN users u ON u.id = uh.leader_id
        JOIN sales s ON s.user_id = uh.subordinate_id
        GROUP BY u.id, u.name, u.email
        ORDER BY total_sales DESC
        LIMIT 1
      `);
      const top_leader = topLeaderQuery.rows[0] || null;

      // 3. Vendas por mês (últimos 12 meses)
      const salesPerMonthQuery = await pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
          DATE_TRUNC('month', created_at) AS month_date,
          COUNT(*) AS count,
          SUM(value) AS revenue
        FROM sales
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date ASC
      `);

      // 4. Comissões por status
      const commissionsSummaryQuery = await pool.query(`
        SELECT 
          CASE WHEN paid THEN 'Pagas' ELSE 'Pendentes' END AS status,
          COUNT(*) AS count,
          SUM(commission_amount) AS amount
        FROM network_commissions
        GROUP BY paid
      `);

      // 5. Distribuição de funções
      const rolesDistributionQuery = await pool.query(`
        SELECT 
          role AS name, 
          COUNT(*) AS count,
          COUNT(CASE WHEN is_active THEN 1 END) AS active_count
        FROM users 
        GROUP BY role
        ORDER BY count DESC
      `);

      // 6. Vendas por status
      const salesByStatusQuery = await pool.query(`
        SELECT 
          status AS name,
          COUNT(*) AS count,
          COALESCE(SUM(value), 0) AS total_value
        FROM sales
        GROUP BY status
        ORDER BY count DESC
      `);

      // 7. Top 5 vendedores
      const topSellersQuery = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COUNT(DISTINCT s.id) AS total_sales,
          COALESCE(SUM(s.value), 0) AS total_revenue,
          COALESCE(u.points, 0) AS total_points
        FROM users u
        LEFT JOIN sales s ON s.user_id = u.id AND s.status = 'approved'
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, u.role
        HAVING COUNT(DISTINCT s.id) > 0
        ORDER BY COUNT(DISTINCT s.id) DESC, total_revenue DESC
        LIMIT 5
      `);

      // 8. Total de pontos distribuídos
      const totalPointsQuery = await pool.query(`
        SELECT 
          COALESCE(SUM(accumulated_points), 0) AS total_points,
          COUNT(DISTINCT user_id) AS users_with_points
        FROM points
      `);

      // 9. Crescimento mensal de usuários
      const userGrowthQuery = await pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
          COUNT(*) AS new_users
        FROM users
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `);

      // 10. Equipes mais produtivas
      const topTeamsQuery = await pool.query(`
        SELECT 
          l.id,
          l.name AS leader_name,
          l.email AS leader_email,
          COUNT(DISTINCT uh.subordinate_id) AS team_size,
          COUNT(s.id) AS total_sales,
          COALESCE(SUM(s.value), 0) AS total_revenue
        FROM users l
        LEFT JOIN user_hierarchy uh ON uh.leader_id = l.id
        LEFT JOIN sales s ON s.user_id = uh.subordinate_id
        GROUP BY l.id, l.name, l.email
        HAVING COUNT(DISTINCT uh.subordinate_id) > 0
        ORDER BY total_revenue DESC
        LIMIT 5
      `);

      // Formatar e retornar dados
      return {
        // Resumo geral
        summary: {
          active_users_count: parseInt(summary?.active_users_count || 0),
          total_users_count: parseInt(summary?.total_users_count || 0),
          inactive_users_count: parseInt(summary?.total_users_count || 0) - parseInt(summary?.active_users_count || 0),
          total_sales_month: parseFloat(summary?.total_sales_month || 0),
          sales_count_month: parseInt(summary?.sales_count_month || 0),
          total_commissions_paid: parseFloat(summary?.total_commissions_paid || 0),
          total_commissions_pending: parseFloat(summary?.total_commissions_pending || 0),
          total_points: parseFloat(totalPointsQuery.rows[0]?.total_points || 0),
          users_with_points: parseInt(totalPointsQuery.rows[0]?.users_with_points || 0),
        },
        
        // Top líder
        top_leader: top_leader ? {
          id: top_leader.id,
          name: top_leader.name,
          email: top_leader.email,
          total_sales: parseFloat(top_leader.total_sales || 0),
          sales_count: parseInt(top_leader.sales_count || 0),
        } : null,
        
        // Gráficos
        charts: {
          sales_per_month: salesPerMonthQuery.rows.map(r => ({
            month: r.month,
            count: parseInt(r.count || 0),
            revenue: parseFloat(r.revenue || 0),
          })),
          
          commissions_summary: commissionsSummaryQuery.rows.map(r => ({
            status: r.status,
            count: parseInt(r.count || 0),
            amount: parseFloat(r.amount || 0),
          })),
          
          roles_distribution: rolesDistributionQuery.rows.map(r => ({
            name: r.name,
            count: parseInt(r.count || 0),
            active_count: parseInt(r.active_count || 0),
          })),
          
          sales_by_status: salesByStatusQuery.rows.map(r => ({
            name: r.name,
            count: parseInt(r.count || 0),
            total_value: parseFloat(r.total_value || 0),
          })),
          
          user_growth: userGrowthQuery.rows.map(r => ({
            month: r.month,
            new_users: parseInt(r.new_users || 0),
          })),
        },
        
        // Top vendedores
        top_sellers: topSellersQuery.rows.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          total_sales: parseInt(r.total_sales || 0),
          total_revenue: parseFloat(r.total_revenue || 0),
          total_points: parseInt(r.total_points || 0),
        })),
        
        // Top equipes
        top_teams: topTeamsQuery.rows.map(r => ({
          id: r.id,
          leader_name: r.leader_name,
          leader_email: r.leader_email,
          team_size: parseInt(r.team_size || 0),
          total_sales: parseInt(r.total_sales || 0),
          total_revenue: parseFloat(r.total_revenue || 0),
        })),
      };
    } catch (error: any) {
      console.error('❌ Erro ao gerar relatórios:', error.message);
      throw new Error('Erro ao gerar relatórios');
    }
  }

  /**
   * Buscar configurações do sistema
   */
  async getSystemConfig() {
    const result = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    const config: Record<string, string | number | boolean> = {};
    
    result.rows.forEach((r) => {
      const value = r.setting_value;
      
      // Convert boolean strings
      if (value === 'true') {
        config[r.setting_key] = true;
      } else if (value === 'false') {
        config[r.setting_key] = false;
      } 
      // Convert numbers
      else if (!isNaN(value) && value !== '') {
        config[r.setting_key] = Number(value);
      } 
      // Keep as string
      else {
        config[r.setting_key] = value;
      }
    });
    
    return config;
  }

  /**
   * ✅ Atualizar configurações do sistema (com log)
   */
  async updateSystemConfig(data: Record<string, any>, adminId: string) {
    const changedKeys: string[] = [];

    for (const key in data) {
      const value = typeof data[key] === 'boolean' ? data[key].toString() : data[key].toString();
      
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, updated_at, updated_by)
         VALUES ($1, $2, NOW(), $3)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
        [key, value, adminId]
      );
      changedKeys.push(key);
    }

    // ✅ REGISTRAR LOG DE ATIVIDADE
    await logActivity(adminId || 'SYSTEM', ActivityAction.UPDATE_SYSTEM_CONFIG, {
      changedKeys,
      newValues: data,
      action: 'update_system_config',
      timestamp: new Date().toISOString()
    });

    return this.getSystemConfig();
  }

  /**
   * Listar todas as notificações
   */
  async getAllNotifications() {
    const result = await pool.query(`
      SELECT 
        n.id, 
        n.user_id, 
        n.title, 
        n.message, 
        n.type, 
        n.is_read, 
        n.created_at,
        u.name as user_name,
        u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 200
    `);
    return result.rows;
  }

  /**
   * ✅ Criar notificação global (com log)
   */
  async createGlobalNotification(
    title: string, 
    message: string, 
    type: string, 
    target: string,
    adminId: string
  ) {
    console.log('🔔 Iniciando criação de notificação global:', { title, message, type, target, adminId });

    // Query base: busca apenas usuários ativos e com email válido
    let usersQuery = `
      SELECT id, name, email, role 
      FROM users 
      WHERE is_active = true 
        AND email IS NOT NULL 
        AND role IS NOT NULL
    `;
    
    if (target === 'leaders') {
      usersQuery += " AND role IN ('master_consultant','senior_consultant','prime_consultant','executive')";
    } else if (target === 'consultants') {
      usersQuery += " AND role = 'consultant'";
    }
    // Se target === 'all', pega todos os usuários ativos
    
    console.log('📊 Executando query:', usersQuery);
    const result = await pool.query(usersQuery);
    const users = result.rows;

    console.log(`👥 Encontrados ${users.length} usuários para notificar`);

    if (users.length === 0) {
      console.warn('⚠️ Nenhum usuário encontrado com os critérios especificados');
      throw new Error('Nenhum usuário ativo encontrado com os critérios especificados');
    }

    // Criar notificações para cada usuário
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [user.id, title, message, type]
        );
        successCount++;
        console.log(`✅ Notificação criada para ${user.name} (${user.email})`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Erro ao criar notificação para ${user.name}:`, error.message);
      }
    }

    console.log(`📊 Resultado: ${successCount} sucesso, ${errorCount} erros`);

    // ✅ REGISTRAR LOG DE ATIVIDADE
    try {
      await logActivity(adminId, ActivityAction.SEND_GLOBAL_NOTIFICATION, {
        title,
        message,
        type,
        target,
        totalRecipients: users.length,
        successCount,
        errorCount,
        action: 'send_global_notification',
        timestamp: new Date().toISOString()
      });
    } catch (logError: any) {
      console.error('⚠️ Erro ao registrar log de atividade:', logError.message);
      // Não falhar a operação por causa do log
    }

    return { 
      count: successCount, 
      errors: errorCount,
      message: `${successCount} notificações enviadas com sucesso${errorCount > 0 ? ` (${errorCount} erros)` : ''}` 
    };
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(id: string) {
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
  }

  /**
   * ✅ Buscar logs de atividade
   */
  async getActivityLogs(search?: string, action?: string) {
    let query = `
      SELECT 
        al.id, al.action, al.metadata as details, al.created_at,
        u.name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (action) {
      query += ` AND al.action ILIKE $${params.length + 1}`;
      params.push(`%${action}%`);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 200';
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * ✅ Buscar logs de acesso (login/logout)
   */
  async getAccessLogs(search?: string, action?: string) {
    let query = `
      SELECT 
        ll.id, ll.user_id, ll.action, ll.ip_address, ll.user_agent, ll.created_at,
        u.name as user_name, u.email as user_email, u.role
      FROM login_logs ll
      LEFT JOIN users u ON u.id = ll.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR ll.ip_address ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (action) {
      query += ` AND ll.action ILIKE $${params.length + 1}`;
      params.push(`%${action}%`);
    }

    query += ' ORDER BY ll.created_at DESC LIMIT 300';
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * ✅ Criar log de atividade manualmente (deprecated - usar logActivity)
   * @deprecated Use logActivity() do utils/activityLogger.ts
   */
  async createActivityLog(userId: string, action: string, details?: any) {
    await logActivity(userId, action, details);
  }

  /**
   * ✅ Gerar relatórios em formato CSV
   */
  async generateReport(type: string, start: string, end: string): Promise<string> {
    console.log(`📊 generateReport chamado: type=${type}, start=${start}, end=${end}`);
    
    switch(type) {
      case 'sales':
        return await this.generateSalesReport(start, end);
      case 'commissions':
        return await this.generateCommissionsReport(start, end);
      case 'team':
        return await this.generateTeamReport(start, end);
      case 'goals':
        return await this.generateGoalsReport(start, end);
      default:
        throw new Error(`Tipo de relatório inválido: ${type}`);
    }
  }

  /**
   * Gerar relatório de vendas
   */
  private async generateSalesReport(start: string, end: string): Promise<string> {
    console.log(`📈 Gerando relatório de vendas: ${start} - ${end}`);
    const result = await pool.query(`
      SELECT 
        s.id,
        TO_CHAR(s.created_at, 'DD/MM/YYYY HH24:MI') as data,
        c.name as cliente,
        c.cpf,
        u.name as vendedor,
        s.value as valor,
        s.kilowatts as kwp,
        s.status
      FROM sales s
      JOIN clients c ON s.client_id = c.id
      JOIN users u ON s.user_id = u.id
      WHERE s.created_at BETWEEN $1 AND $2
      ORDER BY s.created_at DESC
    `, [start, end]);

    console.log(`✅ Query vendas retornou ${result.rows.length} registros`);
    const headers = 'ID;Data;Cliente;CPF;Vendedor;Valor;kWp;Status\n';
    const rows = result.rows.map(r => 
      `${r.id};${r.data};${r.cliente};${r.cpf || 'N/A'};${r.vendedor};R$ ${parseFloat(r.valor).toFixed(2)};${r.kwp};${r.status}`
    ).join('\n');
    
    return headers + rows;
  }

  /**
   * Gerar relatório de comissões
   */
  private async generateCommissionsReport(start: string, end: string): Promise<string> {
    console.log(`💰 Gerando relatório de comissões: ${start} - ${end}`);
    const result = await pool.query(`
      SELECT 
        'Pessoal' as tipo,
        pc.id,
        TO_CHAR(pc.created_at, 'DD/MM/YYYY HH24:MI') as data,
        u.name as usuario,
        u.email,
        s.id as venda_id,
        pc.commission_amount as valor,
        CASE WHEN pc.paid THEN 'Pago' ELSE 'Pendente' END as status
      FROM personal_commissions pc
      JOIN users u ON pc.user_id = u.id
      LEFT JOIN sales s ON pc.sale_id = s.id
      WHERE pc.created_at BETWEEN $1 AND $2
      
      UNION ALL
      
      SELECT 
        'Rede' as tipo,
        nc.id,
        TO_CHAR(nc.created_at, 'DD/MM/YYYY HH24:MI') as data,
        u.name as usuario,
        u.email,
        s.id as venda_id,
        nc.commission_amount as valor,
        CASE WHEN nc.paid THEN 'Pago' ELSE 'Pendente' END as status
      FROM network_commissions nc
      JOIN users u ON nc.leader_id = u.id
      LEFT JOIN sales s ON nc.sale_id = s.id
      WHERE nc.created_at BETWEEN $3 AND $4
      
      ORDER BY data DESC
    `, [start, end, start, end]);

    console.log(`✅ Query comissões retornou ${result.rows.length} registros`);
    const headers = 'Tipo;ID;Data;Usuário;Email;Venda ID;Valor;Status\n';
    const rows = result.rows.map(r => 
      `${r.tipo};${r.id};${r.data};${r.usuario};${r.email};${r.venda_id || 'N/A'};R$ ${parseFloat(r.valor).toFixed(2)};${r.status}`
    ).join('\n');
    
    return headers + rows;
  }

  /**
   * Gerar relatório da equipe
   */
  private async generateTeamReport(start: string, end: string): Promise<string> {
    console.log(`👥 Gerando relatório de equipe: ${start} - ${end}`);
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name as nome,
        u.email,
        u.role as cargo,
        u.is_active as ativo,
        TO_CHAR(u.created_at, 'DD/MM/YYYY') as data_cadastro,
        COALESCE(leader.name, 'N/A') as patrocinador,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id AND created_at BETWEEN $1 AND $2) as vendas,
        COALESCE((SELECT SUM(value) FROM sales WHERE user_id = u.id AND created_at BETWEEN $1 AND $2), 0) as valor_total,
        COALESCE((SELECT SUM(commission_amount) FROM personal_commissions WHERE user_id = u.id AND created_at BETWEEN $1 AND $2), 0) as comissoes
      FROM users u
      LEFT JOIN user_hierarchy uh ON u.id = uh.subordinate_id
      LEFT JOIN users leader ON uh.leader_id = leader.id
      ORDER BY vendas DESC, valor_total DESC
    `, [start, end]);

    const headers = 'ID;Nome;Email;Cargo;Ativo;Cadastro;Patrocinador;Vendas;Valor Total;Comissões\n';
    const rows = result.rows.map(r => 
      `${r.id};${r.nome};${r.email};${r.cargo};${r.ativo ? 'Sim' : 'Não'};${r.data_cadastro};${r.patrocinador};${r.vendas};R$ ${parseFloat(r.valor_total).toFixed(2)};R$ ${parseFloat(r.comissoes).toFixed(2)}`
    ).join('\n');
    
    return headers + rows;
  }

  /**
   * Gerar relatório de metas
   */
  private async generateGoalsReport(start: string, end: string): Promise<string> {
    // Buscar vendas agrupadas por usuário no período
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name as vendedor,
        u.email,
        COUNT(s.id) as vendas_realizadas,
        COALESCE(SUM(s.value), 0) as valor_total,
        COALESCE(SUM(s.kilowatts), 0) as kwp_total,
        TO_CHAR(MIN(s.created_at), 'DD/MM/YYYY') as primeira_venda,
        TO_CHAR(MAX(s.created_at), 'DD/MM/YYYY') as ultima_venda
      FROM users u
      LEFT JOIN sales s ON s.user_id = u.id AND s.created_at BETWEEN $1 AND $2
      WHERE u.role IN ('vendedor', 'gerente', 'diretor', 'ceo')
      GROUP BY u.id, u.name, u.email
      ORDER BY vendas_realizadas DESC, valor_total DESC
    `, [start, end]);

    const headers = 'ID;Vendedor;Email;Vendas;Valor Total;kWp Total;Primeira Venda;Última Venda\n';
    const rows = result.rows.map(r => 
      `${r.id};${r.vendedor};${r.email};${r.vendas_realizadas};R$ ${parseFloat(r.valor_total).toFixed(2)};${parseFloat(r.kwp_total).toFixed(2)};${r.primeira_venda || 'N/A'};${r.ultima_venda || 'N/A'}`
    ).join('\n');
    
    return headers + rows;
  }
}

export const adminService = new AdminService();
