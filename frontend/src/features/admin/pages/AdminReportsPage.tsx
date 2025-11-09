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
} from 'recharts';
import toast from 'react-hot-toast';

export function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/reports');
        setData(res.data?.data || {});
      } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
        toast.error('Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading || !data)
    return <p className="text-center mt-10 text-gray-500">Carregando relatórios...</p>;

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600 text-sm">Visão geral do desempenho da rede</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Faturamento Mensal</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              R$ {data.total_sales_month?.toLocaleString('pt-BR') || '—'}
            </p>
          </div>
          <DollarSign className="w-6 h-6 text-green-600" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Comissões Pagas</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              R$ {data.total_commissions_paid?.toLocaleString('pt-BR') || '—'}
            </p>
          </div>
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Consultores Ativos</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {data.active_users_count || '—'}
            </p>
          </div>
          <Users className="w-6 h-6 text-amber-600" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Melhor Líder (vendas)</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">
              {data.top_leader?.name || '---'}
            </p>
          </div>
          <Award className="w-6 h-6 text-yellow-500" />
        </Card>
      </div>

      {/* Gráfico de Faturamento Mensal */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-blue-600" /> Faturamento por Mês
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChartComp data={data.sales_per_month}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
            />
          </LineChartComp>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Comissões Pagas x Pendentes */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-600" /> Comissões Pagas x Pendentes
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.commissions_summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Distribuição de Cargos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" /> Distribuição de Funções
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.roles_distribution || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ name, percent }: any) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.roles_distribution?.map((_: any, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              )) || []}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
