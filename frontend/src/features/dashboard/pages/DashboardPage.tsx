import { useAuthStore } from '@/store/authStore';
import { StatsCard } from '../components/StatsCard';
import { Loading } from '@/components/ui/Loading';
import { DollarSign, TrendingUp, Award, Users, Target, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import api from '@/services/api';

// ✅ THRESHOLDS CORRETOS
const LEVEL_THRESHOLDS = {
  'Consultor Elite': 0,
  'Master': 1000,
  'Consultor Sênior': 10000,
  'Consultor Prime': 300000,
  'Executivo': 2000000,
};

// ✅ FORMATADORES
const formatNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Math.floor(value).toLocaleString('pt-BR');
};

const formatCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ✅ TOOLTIP CUSTOMIZADO
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          {formatNumber(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// ✅ OBTER PRÓXIMO NÍVEL
const getNextLevel = (currentLevel: string): string => {
  const levelOrder = ['Consultor Elite', 'Master', 'Consultor Sênior', 'Consultor Prime', 'Executivo'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  return levelOrder[Math.min(currentIndex + 1, levelOrder.length - 1)];
};

// ✅ CALCULAR PROGRESSO
const calculateProgressPercentage = (currentPoints: number, levelName: string): number => {
  const levelOrder = ['Consultor Elite', 'Master', 'Consultor Sênior', 'Consultor Prime', 'Executivo'];
  const currentIndex = levelOrder.indexOf(levelName);

  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[levelName as keyof typeof LEVEL_THRESHOLDS] || 0;
  const nextLevel = levelOrder[currentIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS];

  const progress = ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

// ✅ CALCULAR PONTOS FALTANTES
const calculatePointsToNextLevel = (currentPoints: number, levelName: string): number => {
  const levelOrder = ['Consultor Elite', 'Master', 'Consultor Sênior', 'Consultor Prime', 'Executivo'];
  const currentIndex = levelOrder.indexOf(levelName);

  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return 0;

  const nextLevel = levelOrder[currentIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS];

  return Math.max(0, nextThreshold - currentPoints);
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ CARREGAR DADOS AO ENTRAR NA PÁGINA
  useEffect(() => {
    fetchDashboardData();
  }, [location.pathname]);

  // ✅ ATUALIZAR A CADA 20 SEGUNDOS
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!isRefreshing) setLoading(true);
      setIsRefreshing(true);

      // ✅ BUSCAR DADOS
      const [dashResponse, chartResponse] = await Promise.all([
        api.get('/users/dashboard'),
        api.get('/sales/chart-data')
      ]);

      // ✅ CORRIGIR O ACESSO AOS DADOS
      const dashData = dashResponse.data?.data || dashResponse.data || {};
      const chartDataResult = chartResponse.data?.data || chartResponse.data || {};

      console.log('📊 Dashboard Response:', dashData);
      console.log('📈 Chart Response:', chartDataResult);

      setDashboardData(dashData);
      setChartData(chartDataResult);

      console.log('✅ Dashboard atualizado');
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      setDashboardData({});
      setChartData({});
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading && !dashboardData) return <Loading />;

  // ✅ DADOS COM VALIDAÇÃO
  const currentPoints = dashboardData?.total_points || 0;
  const currentLevel = dashboardData?.level || 'Consultor Elite';
  const totalSales = dashboardData?.total_sales || 0;
  const totalRevenue = dashboardData?.total_revenue || 0;
  const totalKilowatts = dashboardData?.total_kilowatts || 0;
  const teamMembers = dashboardData?.team_members || 0;

  console.log('🔍 Dados do Dashboard:', { totalSales, totalRevenue, totalKilowatts, currentPoints });

  const progressPercentage = calculateProgressPercentage(currentPoints, currentLevel);
  const pointsToNext = calculatePointsToNextLevel(currentPoints, currentLevel);
  const nextLevel = getNextLevel(currentLevel);

  // ✅ DADOS DOS GRÁFICOS
  const barChartData = chartData?.monthly || [];
  const pieChartData = chartData?.byStatus || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Bem-vindo, {user?.name}! 👋</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            title="Atualizar dados"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Receita Total"
            value={formatCurrency(totalRevenue)}
          />

          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Vendas"
            value={formatNumber(totalSales)}
          />
          <StatsCard
            icon={<Award className="w-6 h-6" />}
            title="Pontos"
            value={formatNumber(currentPoints)}
          />
          <StatsCard
            icon={<Users className="w-6 h-6" />}
            title="Equipe"
            value={formatNumber(teamMembers)}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progresso de Nível */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Próximo Nível: {nextLevel}
              </h3>
              <Link
                to="/goals"
                className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Ver metas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {/* Nível Atual */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Nível Atual: <strong className="text-gray-900">{currentLevel}</strong>
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {formatNumber(currentPoints)} / {formatNumber(currentPoints + pointsToNext)} pts
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-sm">
                  <div
                    className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-4 rounded-full transition-all duration-700 ease-out shadow-md"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>{Math.round(progressPercentage)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Pontos Faltantes */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-gray-600">
                  Faltam <strong className="text-yellow-700">{formatNumber(pointsToNext)}</strong> pontos para <strong className="text-yellow-700">{nextLevel}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  ⚡ Complete mais vendas para acumular pontos!
                </p>
              </div>

              {/* Estrutura de Níveis */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-3">Estrutura de Níveis:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="bg-blue-50 rounded p-2 text-center">
                    <p className="text-xs font-bold text-blue-900">Elite</p>
                    <p className="text-xs text-blue-600">0 pts</p>
                  </div>
                  <div className="bg-green-50 rounded p-2 text-center">
                    <p className="text-xs font-bold text-green-900">Master</p>
                    <p className="text-xs text-green-600">1K</p>
                  </div>
                  <div className="bg-purple-50 rounded p-2 text-center">
                    <p className="text-xs font-bold text-purple-900">Sênior</p>
                    <p className="text-xs text-purple-600">10K</p>
                  </div>
                  <div className="bg-orange-50 rounded p-2 text-center">
                    <p className="text-xs font-bold text-orange-900">Prime</p>
                    <p className="text-xs text-orange-600">300K</p>
                  </div>
                  <div className="bg-red-50 rounded p-2 text-center">
                    <p className="text-xs font-bold text-red-900">Exec</p>
                    <p className="text-xs text-red-600">2M</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Lateral */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Seu Nível</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-blue-100 text-sm">Nível Atual</p>
                <p className="text-3xl font-bold">{currentLevel}</p>
              </div>

              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Pontos Totais</p>
                <p className="text-2xl font-bold">{formatNumber(currentPoints)}</p>
              </div>

              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Progresso</p>
                <p className="text-xl font-bold">{Math.round(progressPercentage)}%</p>
              </div>

              <Link
                to="/sales"
                className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors text-center block"
              >
                Registrar Venda
              </Link>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Vendas Mensais */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Vendas Mensais</h3>
            {barChartData && barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>

          {/* Status das Vendas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Status das Vendas</h3>
            {pieChartData && pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {pieChartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* Resumo de Desempenho */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Resumo de Desempenho
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Meta Mensal</p>
              <p className="text-2xl font-bold text-blue-600">1000 kW</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Total kW</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(totalKilowatts)} kW</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Faltam</p>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(Math.max(1000 - totalKilowatts, 0))} kW</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">Pontos p/ Próx. Nível</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(pointsToNext)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
