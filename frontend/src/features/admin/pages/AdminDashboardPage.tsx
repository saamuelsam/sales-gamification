import { useEffect, useState } from 'react';
import { DollarSign, Users, Award, Zap, TrendingUp, UserCheck, UserX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  total_users: number;
  total_teams: number;
  total_sales: number;
  total_commissions_paid: number;
}

interface Reports {
  summary: {
    active_users_count: number;
    total_users_count: number;
    inactive_users_count: number;
    total_sales_month: number;
    sales_count_month: number;
    total_commissions_paid: number;
    total_commissions_pending: number;
    total_points: number;
    users_with_points: number;
  };
  top_leader: {
    id: string;
    name: string;
    email: string;
    total_sales: number;
    sales_count: number;
  } | null;
  charts: {
    sales_per_month: Array<{ month: string; count: number; revenue: number }>;
    commissions_summary: Array<{ status: string; count: number; amount: number }>;
    roles_distribution: Array<{ name: string; count: number; active_count: number }>;
    sales_by_status: Array<{ name: string; count: number; total_value: number }>;
  };
  top_sellers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    total_sales: number;
    total_revenue: number;
    total_points: number;
  }>;
  top_teams: Array<{
    id: string;
    leader_name: string;
    leader_email: string;
    team_size: number;
    total_sales: number;
    total_revenue: number;
  }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Iniciando fetch de dados do admin...');
        
        const [statsRes, reportsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/reports')
        ]);
        
        console.log('📊 Stats Response:', statsRes.data);
        console.log('📈 Reports Response:', reportsRes.data);
        
        setStats(statsRes.data?.data || {});
        setReports(reportsRes.data?.data || null);
        
        console.log('✅ Dados carregados:', {
          stats: statsRes.data?.data,
          reports: reportsRes.data?.data
        });
      } catch (error: any) {
        console.error('❌ Erro ao buscar dados do admin:', error);
        console.error('❌ Erro detalhado:', error.response?.data);
        toast.error('Erro ao carregar dados do painel');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  const summary = reports?.summary;
  const topLeader = reports?.top_leader;

  const statCards = [
    { 
      label: 'Consultores Ativos', 
      value: summary?.active_users_count || 0,
      subtitle: `${summary?.total_users_count || 0} total`,
      icon: <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      label: 'Consultores Inativos', 
      value: summary?.inactive_users_count || 0,
      subtitle: 'Desativados',
      icon: <UserX className="w-6 h-6 text-gray-600 dark:text-gray-400" />,
      bgColor: 'bg-gray-50 dark:bg-gray-700'
    },
    { 
      label: 'Vendas do Mês', 
      value: summary?.sales_count_month || 0,
      subtitle: `R$ ${(summary?.total_sales_month || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      icon: <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />,
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      label: 'Comissões Pagas', 
      value: `R$ ${(summary?.total_commissions_paid || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      subtitle: `R$ ${(summary?.total_commissions_pending || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pendentes`,
      icon: <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Painel Administrativo</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Visão geral do desempenho do sistema</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <Card key={idx} className={`p-5 ${card.bgColor} border-gray-200 dark:border-gray-700`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className="ml-4">{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Líder */}
      {topLeader && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">🏆 Top Líder do Mês</h3>
              <p className="text-gray-700 dark:text-gray-300 font-semibold">{topLeader.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {topLeader.sales_count} vendas • R$ {topLeader.total_sales.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Mês */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Vendas por Mês</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reports?.charts.sales_per_month || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Comissões */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Comissões</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={reports?.charts.commissions_summary || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {reports?.charts.commissions_summary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Vendedores */}
      {reports && reports.top_sellers.length > 0 && (
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top 5 Vendedores</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Vendas</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Receita</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {reports.top_sellers.map((seller, idx) => (
                  <tr key={seller.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{seller.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{seller.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-900 dark:text-gray-100 font-semibold">{seller.total_sales}</td>
                    <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-semibold">
                      R$ {seller.total_revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right py-3 px-4 text-blue-600 dark:text-blue-400 font-semibold">
                      {seller.total_points.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Top Equipes */}
      {reports && reports.top_teams.length > 0 && (
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top 5 Equipes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Líder</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Membros</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Vendas</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {reports.top_teams.map((team, idx) => (
                  <tr key={team.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{team.leader_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{team.leader_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                      <Users className="w-4 h-4 inline mr-1" />
                      {team.team_size}
                    </td>
                    <td className="text-center py-3 px-4 text-gray-900 dark:text-gray-100 font-semibold">{team.total_sales}</td>
                    <td className="text-right py-3 px-4 text-green-600 dark:text-green-400 font-semibold">
                      R$ {team.total_revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
