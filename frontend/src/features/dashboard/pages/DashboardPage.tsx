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

// ✅ FORMATADORES ATUALIZADOS
const formatNumber = (value: number): string => {
  if (!value && value !== 0) return '0';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ✅ TOOLTIP CUSTOMIZADO PARA GRÁFICOS
const CustomTooltip = ({ active, payload, label, isCurrency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          {isCurrency 
            ? formatCurrency(payload[0].value)
            : formatNumber(payload[0].value)
          }
        </p>
      </div>
    );
  }
  return null;
};

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
          value={data?.personal?.sales?.total_revenue || 0}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
          variant="green"
          isCurrency={true}
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
            <span className="text-sm font-bold text-gray-900">
              {formatNumber(data?.personal?.points?.total_points || 0)} pontos
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((data?.personal?.points?.total_points || 0) / 1000 * 100, 100)}%` }}
            ></div>
          </div>

          <p className="text-xs text-gray-600">
            Faltam <strong className="text-gray-900">{formatNumber(Math.max(1000 - (data?.personal?.points?.total_points || 0), 0))}</strong> pontos para o próximo nível
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
            Minha Equipe ({formatNumber(data.team.members.length)})
          </h3>

          <div className="space-y-3">
            {data.team.members.slice(0, 3).map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-600">
                    {formatNumber(member.total_points)} pontos
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(member.total_revenue)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatNumber(member.total_sales)} vendas
                  </p>
                </div>
              </div>
            ))}
          </div>

          {data.team.members.length > 3 && (
            <Link
              to="/team"
              className="mt-4 block text-center text-sm text-blue-600 font-medium hover:underline"
            >
              Ver todos os {formatNumber(data.team.members.length)} membros
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !chartData || (pieData.length === 0 && (!chartData?.monthly || chartData.monthly.length === 0)) ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <TrendingUp size={48} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhuma venda registrada ainda</p>
            <Link to="/sales" className="text-blue-600 text-sm mt-2 hover:underline font-medium">
              Registrar primeira venda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Vendas Mensais */}
            {chartData?.monthly && chartData.monthly.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Vendas Mensais</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]}
                    />
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
                      label={({ name, percent }: any) => {
                        const percentValue = (Number(percent) * 100).toFixed(0);
                        return percentValue !== '0' ? `${name}: ${percentValue}%` : '';
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legenda customizada */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {pieData.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-700">
                        {entry.name}: <strong>{formatNumber(entry.value)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
