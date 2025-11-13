import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  BarChart2,
  LineChart,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  LineChart as LineChartComp,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import toast from 'react-hot-toast';

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface ReportData {
  summary?: {
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
  top_leader?: {
    id: string;
    name: string;
    email: string;
    total_sales: number;
    sales_count: number;
  };
  charts?: {
    sales_per_month: Array<{ month: string; count: number; revenue: number }>;
    commissions_summary: Array<{ status: string; count: number; amount: number }>;
    roles_distribution: Array<{ role: string; count: number }>;
    sales_by_status: Array<{ status: string; count: number }>;
    user_growth: Array<{ month: string; count: number }>;
  };
  top_sellers?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    total_sales: number;
    total_revenue: number;
    total_points: number;
  }>;
  top_teams?: Array<{
    leader_id: string;
    leader_name: string;
    leader_email: string;
    team_size: number;
    total_sales: number;
    total_revenue: number;
  }>;
}

export function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports', {
        params: { period }
      });
      setData(res.data?.data || {});
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data?.top_sellers) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Nome', 'Email', 'Nível', 'Vendas', 'Receita', 'Pontos'];
    const rows = data.top_sellers.map(seller => [
      seller.name,
      seller.email,
      seller.role,
      seller.total_sales,
      seller.total_revenue,
      seller.total_points
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendedores-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  const getPeriodLabel = (p: PeriodFilter) => {
    const labels = {
      today: 'Hoje',
      week: 'Última Semana',
      month: 'Último Mês',
      quarter: 'Último Trimestre',
      year: 'Último Ano',
      custom: 'Personalizado'
    };
    return labels[p];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      consultant: 'Consultor Elite',
      master_consultant: 'Master',
      senior_consultant: 'Consultor Sênior',
      prime_consultant: 'Consultor Prime',
      executive: 'Executivo',
      ceo: 'CEO',
      admin: 'Administrador'
    };
    return roles[role] || role;
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <p className="text-center mt-10 text-gray-500 dark:text-gray-400">
          Carregando relatórios...
        </p>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444'];
  const summary = data.summary || {};
  const charts = data.charts || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Relatórios e Análises
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Visão geral do desempenho da rede
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{getPeriodLabel(period)}</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros de Período */}
      {showFilters && (
        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Período</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'quarter', 'year'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Faturamento
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(summary.total_sales_month || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {summary.sales_count_month || 0} vendas
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Comissões Pagas
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(summary.total_commissions_paid || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Pendente: {formatCurrency(summary.total_commissions_pending || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Consultores
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {summary.active_users_count || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {summary.total_users_count || 0} total
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Top Líder
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-1 truncate">
                {data.top_leader?.name || '---'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {data.top_leader?.sales_count || 0} vendas
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento Mensal */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Faturamento por Mês
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={charts.sales_per_month || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Comissões */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Comissões
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.commissions_summary || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="status" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição de Níveis */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Distribuição de Níveis
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.roles_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ role, percent }: any) => {
                  if (!role) return '';
                  const formattedRole = formatRole(role);
                  const firstWord = formattedRole.split(' ')[0];
                  return `${firstWord} ${(percent * 100).toFixed(0)}%`;
                }}
              >
                {(charts.roles_distribution || []).map((item: any, index: number) => (
                  <Cell key={`cell-${item.role || index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Crescimento de Usuários */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Crescimento de Usuários
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChartComp data={charts.user_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Novos usuários"
              />
            </LineChartComp>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Vendedores */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          🏆 Top 10 Vendedores
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Nível
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">
                  Vendas
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">
                  Receita
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">
                  Pontos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {(data.top_sellers || []).map((seller, index) => (
                <tr
                  key={`seller-${seller.id}-${index}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {seller.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {seller.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {formatRole(seller.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {seller.total_sales}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(seller.total_revenue)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-purple-600 dark:text-purple-400">
                      {seller.total_points.toLocaleString('pt-BR')}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data.top_sellers || data.top_sellers.length === 0) && (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum vendedor encontrado
            </p>
          )}
        </div>
      </Card>

      {/* Top Times */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          👥 Top 5 Times
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Líder
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">
                  Time
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">
                  Vendas
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-right">
                  Receita Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {(data.top_teams || []).map((team, index) => (
                <tr
                  key={`team-${team.leader_id}-${index}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {team.leader_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {team.leader_email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{team.team_size}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {team.total_sales}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(team.total_revenue)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data.top_teams || data.top_teams.length === 0) && (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum time encontrado
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
