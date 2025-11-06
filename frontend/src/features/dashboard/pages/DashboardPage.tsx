// frontend/src/pages/DashboardPage.tsx

import { useAuthStore } from '@/store/authStore';
import { StatsCard } from '../components/StatsCard';
import { Loading } from '@/components/ui/Loading';
import {
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Target,
  ArrowRight,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

const parseNumberFromAny = (v: any): number => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  s = s.replace(/\s?pts/gi, '');
  s = s.replace(/\s?kW/gi, '');
  s = s.replace(/\s?KW/gi, '');
  s = s.replace(/\./g, '').replace(/,/g, '.');
  const match = s.match(/^([\d.]+)\s*([kKmM])?$/);
  if (match) {
    const n = parseFloat(match[1]);
    const suffix = (match[2] || '').toUpperCase();
    if (suffix === 'K') return isNaN(n) ? 0 : n * 1_000;
    if (suffix === 'M') return isNaN(n) ? 0 : n * 1_000_000;
    return isNaN(n) ? 0 : n;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const formatCurrency = (value: number): string => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatNumberFull = (value: number): string => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR');
};

const formatNumberCompact = (value: number): string => {
  const num = Number(value) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (num >= 1000) return `${Math.round(num / 1000)}K`;
  return num.toLocaleString('pt-BR');
};

const formatKilowatts = (value: number): string => {
  const num = Number(value) || 0;
  return `${num.toLocaleString('pt-BR')} kW`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rawValue = payload[0].value;
    const parsed = parseNumberFromAny(rawValue);
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-blue-600 font-bold">{formatNumberFull(parsed)}</p>
      </div>
    );
  }
  return null;
};

const LEVEL_THRESHOLDS = {
  elite: { display: 'Consultor Elite', points: 0 },
  master: { display: 'Master', points: 1_000 },
  seniorConsultant: { display: 'Consultor Sênior', points: 10_000 },
  consultorPrime: { display: 'Consultor Prime', points: 800_000 },
  executive: { display: 'Executivo', points: 2_000_000 }
};

const getNextLevel = (currentLevel: string): string => {
  const levelOrder = ['elite', 'master', 'seniorConsultant', 'consultorPrime', 'executive'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return 'executive';
  return levelOrder[currentIndex + 1];
};

const calculateProgressPercentage = (currentPoints: number, levelName: string): number => {
  const levelOrder = ['elite', 'master', 'seniorConsultant', 'consultorPrime', 'executive'];
  const currentIndex = levelOrder.indexOf(levelName);

  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[levelName as keyof typeof LEVEL_THRESHOLDS]?.points || 0;
  const nextLevel = levelOrder[currentIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS]?.points || 0;

  const progress = ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

const calculatePointsToNextLevel = (currentPoints: number, levelName: string): number => {
  const levelOrder = ['elite', 'master', 'seniorConsultant', 'consultorPrime', 'executive'];
  const currentIndex = levelOrder.indexOf(levelName);

  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return 0;

  const nextLevel = levelOrder[currentIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS]?.points || 0;
  return Math.max(0, nextThreshold - currentPoints);
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData();
    };

    window.addEventListener('refreshDashboard', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('refreshDashboard', handleRefresh as EventListener);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [location.pathname]);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!loading) setIsRefreshing(true);

      const timestamp = Date.now();
      const dashResponse = await api.get(`/users/dashboard?_t=${timestamp}`);
      const dashData = dashResponse.data?.data || {};

      setDashboardData(dashData);
    } catch (error: any) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchDashboardData();
    toast.success('Dashboard atualizado!');
  };

  if (loading && !dashboardData) return <Loading />;

  const totalRevenueRaw = dashboardData?.total_revenue ?? dashboardData?.totalRevenue ?? 0;
  let totalRevenue = parseNumberFromAny(totalRevenueRaw);

  if (totalRevenue > 0 && totalRevenue < 1000) {
    totalRevenue = totalRevenue * 1000;
  }

  const totalSales = Math.round(
    parseNumberFromAny(dashboardData?.total_sales ?? dashboardData?.totalSales ?? 0)
  );

  const currentPoints = Math.round(
    parseNumberFromAny(dashboardData?.total_points ?? dashboardData?.totalPoints ?? 0)
  );

  const totalKilowatts = parseNumberFromAny(
    dashboardData?.total_kilowatts ?? dashboardData?.totalKilowatts ?? 0
  );

  let currentLevel = String(dashboardData?.level ?? 'elite').toLowerCase().trim();
  const levelMap: any = {
    'consultorelit': 'elite',
    'consultor elite': 'elite',
    'elite': 'elite',
    'master': 'master',
    'consultor sênior': 'seniorConsultant',
    'sênior': 'seniorConsultant',
    'consultor prime': 'consultorPrime',
    'prime': 'consultorPrime',
    'executivo': 'executive',
    'exec': 'executive',
  };
  currentLevel = levelMap[currentLevel] || 'elite';

  const teamMembers = Math.round(
    parseNumberFromAny(dashboardData?.team_members ?? dashboardData?.teamMembers ?? 0)
  );

  const progressPercentage = calculateProgressPercentage(currentPoints, currentLevel);
  const pointsToNext = calculatePointsToNextLevel(currentPoints, currentLevel);
  const nextLevel = getNextLevel(currentLevel);

  const barChartData = dashboardData?.charts?.monthly || [];
  const pieChartData = dashboardData?.charts?.byStatus || [];

  const currentLevelDisplay = LEVEL_THRESHOLDS[currentLevel as keyof typeof LEVEL_THRESHOLDS]?.display || 'Elite';
  const nextLevelDisplay = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS]?.display || 'Executivo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 truncate">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base truncate">Bem-vindo, {user?.name}! 👋</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 text-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Receita Total"
            value={totalRevenue}
          />

          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Vendas"
            value={totalSales}
          />

          <StatsCard
            icon={<Zap className="w-6 h-6" />}
            title="Pontos"
            value={currentPoints}
            compact={false}
          />

          <StatsCard
            icon={<Users className="w-6 h-6" />}
            title="Equipe"
            value={teamMembers}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 sm:w-5 h-5 text-yellow-500 flex-shrink-0" />
                <span className="truncate">Próximo: {nextLevelDisplay}</span>
              </h3>
              <Link
                to="/goals"
                className="text-blue-600 text-xs sm:text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all flex-shrink-0 whitespace-nowrap"
              >
                Ver metas <ArrowRight className="w-3 h-3 sm:w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="font-medium text-gray-700">
                  Nível: <strong className="text-gray-900">{currentLevelDisplay}</strong>
                </span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm">
                  {formatNumberFull(currentPoints)} / {formatNumberFull(currentPoints + pointsToNext)}
                </span>
              </div>

              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden shadow-sm">
                  <div
                    className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-full rounded-full transition-all duration-700 ease-out shadow-md"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{Math.round(progressPercentage)}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                <p className="text-xs sm:text-sm text-gray-600">
                  Faltam <strong className="text-yellow-700">{formatNumberFull(pointsToNext)}</strong> pontos para{' '}
                  <strong className="text-yellow-700">{nextLevelDisplay}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">⚡ Complete mais vendas!</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Estrutura de Níveis:</p>
                <div className="grid grid-cols-5 gap-1">
                  <div className="bg-blue-50 rounded p-1 sm:p-2 text-center">
                    <p className="text-xs font-bold text-blue-900">Elite</p>
                    <p className="text-xs text-blue-600">0</p>
                  </div>
                  <div className="bg-green-50 rounded p-1 sm:p-2 text-center">
                    <p className="text-xs font-bold text-green-900">Master</p>
                    <p className="text-xs text-green-600">1K</p>
                  </div>
                  <div className="bg-purple-50 rounded p-1 sm:p-2 text-center">
                    <p className="text-xs font-bold text-purple-900">Sênior</p>
                    <p className="text-xs text-purple-600">10K</p>
                  </div>
                  <div className="bg-orange-50 rounded p-1 sm:p-2 text-center">
                    <p className="text-xs font-bold text-orange-900">Prime</p>
                    <p className="text-xs text-orange-600">800K</p>
                  </div>
                  <div className="bg-red-50 rounded p-1 sm:p-2 text-center">
                    <p className="text-xs font-bold text-red-900">Exec</p>
                    <p className="text-xs text-red-600">2M</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 sm:w-6 h-6" />
              <h3 className="text-base sm:text-lg font-semibold">Seu Nível</h3>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Nível Atual</p>
                <p className="text-2xl sm:text-3xl font-bold">{currentLevelDisplay}</p>
              </div>

              <div className="bg-white/20 rounded-lg p-2 sm:p-3">
                <p className="text-blue-100 text-xs mb-1">Pontos Totais</p>
                <p className="text-xl sm:text-2xl font-bold">{formatNumberFull(currentPoints)}</p>
              </div>

              <div className="bg-white/20 rounded-lg p-2 sm:p-3">
                <p className="text-blue-100 text-xs mb-1">Progresso</p>
                <p className="text-lg sm:text-xl font-bold">{Math.round(progressPercentage)}%</p>
              </div>

              <Link
                to="/sales"
                className="w-full bg-white text-blue-600 font-semibold py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-50 transition-colors text-center block text-sm sm:text-base"
              >
                Registrar Venda
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Vendas Mensais</h3>
            {barChartData && barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 text-sm">
                Sem dados
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Status das Vendas</h3>
            {pieChartData && pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }: any) => `${name}: ${count}`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {pieChartData.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 text-sm">
                Sem dados
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 h-5 text-blue-600" />
            <span>Resumo de Desempenho</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm">Meta Mensal</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">400 kW</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm">Total kW</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{formatKilowatts(totalKilowatts)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm">Faltam</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {formatNumberFull(Math.max(400 - totalKilowatts, 0))}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
              <p className="text-gray-600 text-xs sm:text-sm">Pontos Próx. Nível</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{formatNumberCompact(pointsToNext)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
