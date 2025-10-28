import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';
import { StatsCard } from '../components/StatsCard';
import { Loading } from '@/components/ui/Loading';
import { 
  DollarSign, 
  TrendingUp, 
  Award, 
  Users, 
  Target,
  ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import api from '@/services/api';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();
  const [chartData, setChartData] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      const response = await api.get('/sales/chart-data');
      setChartData(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const statusLabels: Record<string, string> = {
    negotiation: 'Negociação',
    pending: 'Pendente',
    approved: 'Aprovado',
    financing_denied: 'Negado',
    cancelled: 'Cancelado',
    delivered: 'Entregue',
  };

  const pieData = chartData?.byStatus?.map((item: any) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
  })) || [];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 py-6 sm:py-8 text-white rounded-b-3xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Olá, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-blue-100 mt-2 text-sm sm:text-base">
          Aqui está um resumo do seu desempenho
        </p>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Vendas"
          value={data?.personal?.sales?.total_sales || 0}
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
          variant="blue"
        />
        <StatsCard
          title="Receita"
          value={`R$ ${(data?.personal?.sales?.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
          variant="green"
        />
        <StatsCard
          title="Pontos"
          value={data?.personal?.points?.total_points || 0}
          icon={<Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />}
          variant="yellow"
        />
        {data?.has_team && (
          <StatsCard
            title="Equipe"
            value={data?.team?.totals?.total_members || 0}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
            variant="purple"
          />
        )}
      </div>

      {/* Progresso de Nível */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Seu Nível
          </h3>
          <Link 
            to="/levels" 
            className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver plano <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {data?.personal?.level?.name || 'Iniciante'}
            </span>
            <span className="text-sm text-gray-600">
              {data?.personal?.points?.total_points || 0} pontos
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((data?.personal?.points?.total_points || 0) / 1000 * 100, 100)}%` }}
            ></div>
          </div>

          <p className="text-xs text-gray-600">
            Faltam {Math.max(1000 - (data?.personal?.points?.total_points || 0), 0)} pontos para o próximo nível
          </p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          to="/sales"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Nova Venda</span>
          </div>
        </Link>

        <Link
          to="/team"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Minha Equipe</span>
          </div>
        </Link>

        <Link
          to="/goals"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Metas</span>
          </div>
        </Link>

        <Link
          to="/benefits"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Benefícios</span>
          </div>
        </Link>
      </div>

      {/* Equipe (se tiver) */}
      {data?.has_team && data?.team?.members && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Minha Equipe ({data.team.members.length})
          </h3>

          <div className="space-y-3">
            {data.team.members.slice(0, 3).map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-gray-600">{member.total_points} pontos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    R$ {member.total_revenue.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-600">{member.total_sales} vendas</p>
                </div>
              </div>
            ))}
          </div>

          {data.team.members.length > 3 && (
            <Link
              to="/team"
              className="mt-4 block text-center text-sm text-blue-600 font-medium hover:underline"
            >
              Ver todos os {data.team.members.length} membros
            </Link>
          )}
        </div>
      )}

      {/* Gráficos de Vendas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Desempenho de Vendas
        </h3>

        {chartLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Carregando gráficos...
          </div>
        ) : !chartData || (pieData.length === 0 && (!chartData?.monthly || chartData.monthly.length === 0)) ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <TrendingUp size={48} className="mb-2 opacity-50" />
            <p>Nenhuma venda registrada ainda</p>
            <Link to="/sales" className="text-blue-600 text-sm mt-2 hover:underline">
              Registrar primeira venda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Barras - Vendas Mensais */}
            {chartData?.monthly && chartData.monthly.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Vendas Mensais</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Pizza - Status */}
            {pieData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Vendas por Status</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
