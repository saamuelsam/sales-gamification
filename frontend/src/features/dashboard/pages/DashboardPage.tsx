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
  RefreshCw,
  Clock,
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
  Cell,
} from 'recharts';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

// --- Funções de utilidade ---
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

// --- Estrutura dos níveis ---
const LEVEL_THRESHOLDS = {
  elite: { display: 'Consultor Elite', points: 0 },
  master: { display: 'Master', points: 1_000 },
  seniorConsultant: { display: 'Consultor Sênior', points: 10_000 },
  consultorPrime: { display: 'Consultor Prime', points: 800_000 },
  executive: { display: 'Executivo', points: 2_000_000 },
};

const getNextLevel = (currentLevel: string): string => {
  const levelOrder = [
    'elite',
    'master',
    'seniorConsultant',
    'consultorPrime',
    'executive',
  ];
  const currentIndex = levelOrder.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === levelOrder.length - 1)
    return 'executive';
  return levelOrder[currentIndex + 1];
};

const calculateProgressPercentage = (currentPoints: number, levelName: string): number => {
  const levelOrder = [
    'elite',
    'master',
    'seniorConsultant',
    'consultorPrime',
    'executive',
  ];
  const currentIndex = levelOrder.indexOf(levelName);
  if (currentIndex === -1) return 0;
  if (currentIndex === levelOrder.length - 1) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[levelName as keyof typeof LEVEL_THRESHOLDS]?.points ?? 0;
  const nextLevel = levelOrder[currentIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS]?.points ?? 0;
  const range = Math.max(nextThreshold - currentThreshold, 1);
  let progress = ((currentPoints - currentThreshold) / range) * 100;

  if (currentPoints >= currentThreshold && progress < 1) progress = 1;
  progress = Math.min(progress, 100);
  return progress;
};

const calculatePointsToNextLevel = (currentPoints: number, levelName: string): number => {
  const levelOrder = [
    'elite',
    'master',
    'seniorConsultant',
    'consultorPrime',
    'executive',
  ];
  const currentIndex = levelOrder.indexOf(levelName);
  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return 0;
  const nextLevel = levelOrder[currentIndex + 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS]?.points || 0;
  return Math.max(0, nextThreshold - currentPoints);
};

// --- Tooltip customizado para charts ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rawValue = payload[0].value;
    const parsed = parseNumberFromAny(rawValue);
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-primary font-bold">{formatNumberFull(parsed)}</p>
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Verificar roles diferentes
  const isCEO = user?.role === 'ceo';
  const isFinanceiro = user?.role === 'financeiro';
  const isAdmin = user?.role === 'admin';
  const hasAdminAccess = isCEO || isAdmin;
  const hasFinanceAccess = isCEO || isFinanceiro;

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

  const totalRevenueRaw =
    dashboardData?.total_revenue ?? dashboardData?.totalRevenue ?? 0;
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
  let currentLevel = String(dashboardData?.level ?? '').toLowerCase().trim();
  const levelMap: Record<string, keyof typeof LEVEL_THRESHOLDS> = {
    'consultor elite': 'elite',
    elite: 'elite',
    master: 'master',
    'consultor sênior': 'seniorConsultant',
    sênior: 'seniorConsultant',
    'consultor prime': 'consultorPrime',
    prime: 'consultorPrime',
    executivo: 'executive',
    exec: 'executive',
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
  const currentLevelDisplay =
    LEVEL_THRESHOLDS[currentLevel as keyof typeof LEVEL_THRESHOLDS]?.display || 'Elite';
  const nextLevelDisplay =
    LEVEL_THRESHOLDS[nextLevel as keyof typeof LEVEL_THRESHOLDS]?.display || 'Executivo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-accent/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-primary-400 truncate">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base truncate">Bem-vindo, {user?.name}! 👋</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-primary hover:bg-highlight disabled:bg-gray-400 text-neutral rounded-lg flex items-center gap-2 text-sm transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-accent' : 'text-neutral'}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            icon={<DollarSign className="w-6 h-6 text-accent" />}
            title="Receita Total"
            value={totalRevenue}
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6 text-highlight" />}
            title="Vendas"
            value={totalSales}
          />
          <StatsCard
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            title="Comissões"
            value={parseNumberFromAny(dashboardData?.total_commissions || 0)}
          />
          <StatsCard
            icon={<Zap className="w-6 h-6 text-accent" />}
            title="Pontos"
            value={currentPoints}
            compact={false}
          />
          <StatsCard
            icon={<Users className="w-6 h-6 text-primary" />}
            title="Equipe"
            value={teamMembers}
          />
        </div>

        {/* ===== CARD DE ATIVIDADE DO CONSULTOR ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-primary dark:text-primary-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            Atividade do Consultor
          </h2>

          {dashboardData?.last_sale_date ? (
            <div className="space-y-2 text-sm sm:text-base">
              <p>
                <span className="text-gray-600 dark:text-gray-300">Última venda:</span>{' '}
                <strong className="text-primary dark:text-primary-400">
                  {new Date(dashboardData.last_sale_date).toLocaleDateString('pt-BR')}
                </strong>
              </p>

              <p>
                <span className="text-gray-600 dark:text-gray-300">Tempo desde a última venda:</span>{' '}
                <strong
                  className={
                    dashboardData.meses_sem_contratos >= 3
                      ? 'text-red-600 dark:text-red-400'
                      : dashboardData.meses_sem_contratos === 2
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-green-600 dark:text-green-400'
                  }
                >
                  {dashboardData.meses_sem_contratos} {dashboardData.meses_sem_contratos === 1 ? 'mês' : 'meses'}
                </strong>
              </p>

              {dashboardData.meses_sem_contratos >= 3 ? (
                <p className="text-red-600 dark:text-red-300 text-sm font-semibold mt-2 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-700">
                  ⚠️ Você será rebaixado se não realizar uma venda este mês.
                </p>
              ) : dashboardData.meses_sem_contratos === 2 ? (
                <p className="text-orange-500 dark:text-orange-300 text-sm font-semibold mt-2 bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
                  ⏳ Atenção! Falta 1 mês para o rebaixamento por inatividade.
                </p>
              ) : (
                <p className="text-green-600 dark:text-green-300 text-sm font-semibold mt-2 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-700">
                  ✅ Ativo e vendendo normalmente.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              💥 Nenhuma venda registrada ainda — realize sua primeira venda para começar a contar atividade.
            </p>
          )}
        </div>

        {/* Progress & Level Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Card de progresso PREMIUM */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 min-w-0 text-gray-900 dark:text-gray-100">
                <Zap className="w-4 h-4 sm:w-5 h-5 text-accent flex-shrink-0" />
                <span className="truncate">Próximo: {nextLevelDisplay}</span>
              </h3>
              <Link
                to="/goals"
                className="text-primary dark:text-primary-400 text-xs sm:text-sm font-medium flex items-center gap-1 hover:gap-2 hover:text-highlight dark:hover:text-highlight transition-all flex-shrink-0 whitespace-nowrap"
              >
                Ver metas <ArrowRight className="w-3 h-3 sm:w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Nível: <strong className="text-primary dark:text-primary-400">{currentLevelDisplay}</strong>
                </span>
                <span className="font-bold text-primary dark:text-primary-400 text-xs sm:text-sm">
                  {formatNumberFull(currentPoints)} / {formatNumberFull(currentPoints + pointsToNext)}
                </span>
              </div>

              {/* Barra de progresso ANIMADA com nova paleta */}
              <div className="relative pt-6">
                {progressPercentage > 0 && (
                  <div
                    className="absolute -top-1 transition-all duration-700 ease-out z-10"
                    style={{
                      left: `calc(${Math.min(progressPercentage, 95)}% - 20px)`,
                    }}
                  >
                    <div className="bg-white dark:bg-gray-700 border-2 border-accent shadow-lg px-3 py-1 rounded-full text-xs font-bold text-primary dark:text-primary-400">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                )}

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full shadow-md transition-[width] duration-1000 ease-in-out bg-gradient-to-r from-accent via-highlight to-primary ${progressPercentage > 0 ? 'animate-pulse-smooth' : ''}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-1">
                  <span>0%</span>
                  <span className="font-semibold text-accent">{ Math.round(progressPercentage)}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-accent/10 to-highlight/10 dark:from-accent/20 dark:to-highlight/20 rounded-lg p-3 sm:p-4 border border-accent/30 dark:border-accent/50">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Faltam <strong className="text-highlight">{ formatNumberFull(pointsToNext)}</strong> pontos para{' '}
                  <strong className="text-highlight">{nextLevelDisplay}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">⚡ Complete mais vendas!</p>
              </div>

              {/* Estrutura de níveis */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Estrutura de Níveis:</p>
                <div className="grid grid-cols-5 gap-1">
                  <div className="bg-primary/10 dark:bg-primary/20 rounded p-1 sm:p-2 text-center border-2 border-primary/30 dark:border-primary/50">
                    <p className="text-xs font-bold text-primary dark:text-primary-400">Elite</p>
                    <p className="text-xs text-primary dark:text-primary-400">0</p>
                  </div>
                  <div className="bg-accent/10 dark:bg-accent/20 rounded p-1 sm:p-2 text-center border-2 border-accent/30 dark:border-accent/50">
                    <p className="text-xs font-bold text-accent">Master</p>
                    <p className="text-xs text-accent">1K</p>
                  </div>
                  <div className="bg-highlight/10 dark:bg-highlight/20 rounded p-1 sm:p-2 text-center border-2 border-highlight/30 dark:border-highlight/50">
                    <p className="text-xs font-bold text-highlight">Sênior</p>
                    <p className="text-xs text-highlight">10K</p>
                  </div>
                  <div className="bg-accent/20 dark:bg-accent/30 rounded p-1 sm:p-2 text-center border-2 border-accent dark:border-accent/70">
                    <p className="text-xs font-bold text-accent">Prime</p>
                    <p className="text-xs text-accent">800K</p>
                  </div>
                  <div className="bg-highlight/20 dark:bg-highlight/30 rounded p-1 sm:p-2 text-center border-2 border-highlight dark:border-highlight/70">
                    <p className="text-xs font-bold text-highlight">Exec</p>
                    <p className="text-xs text-highlight">2M</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card lateral do nível com nova paleta */}
          <div className="bg-gradient-to-br from-primary to-highlight rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 sm:w-6 h-6" />
              <h3 className="text-base sm:text-lg font-semibold">Seu Nível</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-white/80 text-xs sm:text-sm">Nível Atual</p>
                <p className="text-2xl sm:text-3xl font-bold">{currentLevelDisplay}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 sm:p-3">
                <p className="text-white/80 text-xs mb-1">Pontos Totais</p>
                <p className="text-xl sm:text-2xl font-bold">{formatNumberFull(currentPoints)}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 sm:p-3">
                <p className="text-white/80 text-xs mb-1">Progresso</p>
                <p className="text-lg sm:text-xl font-bold">{Math.round(progressPercentage)}%</p>
              </div>
              <Link
                to="/sales"
                className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors text-center block text-sm sm:text-base shadow-md"
              >
                Registrar Venda
              </Link>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary dark:text-primary-400">Vendas Mensais</h3>
            {barChartData && barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#123450" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                Sem dados
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary dark:text-primary-400">Status das Vendas</h3>
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
                        fill={['#123450', '#F9A60C', '#FC6E22', '#10b981', '#8b5cf6'][index % 5]}
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

        {/* Resumo de desempenho */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 h-5 text-primary dark:text-primary-400" />
            <span className="text-primary dark:text-primary-400">Resumo de Desempenho</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-3 sm:p-4 border border-primary/20 dark:border-primary/40">
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Meta Mensal</p>
              <p className="text-lg sm:text-2xl font-bold text-primary dark:text-primary-400">400 kW</p>
            </div>
            <div className="bg-accent/10 dark:bg-accent/20 rounded-lg p-3 sm:p-4 border border-accent/20 dark:border-accent/40">
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Total kW</p>
              <p className="text-lg sm:text-2xl font-bold text-accent">{formatKilowatts(totalKilowatts)}</p>
            </div>
            <div className="bg-highlight/10 dark:bg-highlight/20 rounded-lg p-3 sm:p-4 border border-highlight/20 dark:border-highlight/40">
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Faltam</p>
              <p className="text-lg sm:text-2xl font-bold text-highlight">
                {formatNumberFull(Math.max(400 - totalKilowatts, 0))}
              </p>
            </div>
            <div className="bg-accent/20 dark:bg-accent/30 rounded-lg p-3 sm:p-4 border border-accent dark:border-accent/70">
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Pontos Próx. Nível</p>
              <p className="text-lg sm:text-2xl font-bold text-accent">{formatNumberCompact(pointsToNext)}</p>
            </div>
          </div>
        </div>

        {/* ===== SEÇÃO ADMINISTRATIVA (CEO/Admin) ===== */}
        {hasAdminAccess && (
          <div className="mt-6 sm:mt-8 lg:mt-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl sm:rounded-2xl shadow-lg border-2 border-primary/20 dark:border-primary/40 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary dark:text-primary-400 flex items-center gap-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent flex-shrink-0" />
                  <span>Painel Administrativo</span>
                  {isCEO && <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">CEO</span>}
                  {isAdmin && !isCEO && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">ADMIN</span>}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-1">
                  Área exclusiva para gestão completa do sistema
                </p>
              </div>
              <Link
                to="/admin"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-highlight text-white rounded-lg text-sm font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                Acessar Painel Completo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
              Controle total sobre usuários, comissões, configurações e logs de auditoria do sistema.
            </p>

            {/* Cards de recursos administrativos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1 - Relatórios */}
              <Link
                to="/admin/reports"
                className="group p-4 sm:p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 sm:p-3 bg-primary/10 dark:bg-primary/20 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gestão de</p>
                    <p className="font-bold text-primary dark:text-primary-400 text-base sm:text-lg truncate">Relatórios</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Visualize estatísticas gerais, faturamento e desempenho da rede.
                </p>
              </Link>

              {/* Card 2 - Configurações */}
              <Link
                to="/admin/config"
                className="group p-4 sm:p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-accent hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 sm:p-3 bg-accent/10 dark:bg-accent/20 rounded-lg group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Configurações</p>
                    <p className="font-bold text-accent text-base sm:text-lg truncate">Sistema</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Gerencie metas, taxas de comissão, níveis e pontuações.
                </p>
              </Link>

              {/* Card 3 - Logs */}
              <Link
                to="/admin/logs"
                className="group p-4 sm:p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-highlight hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 sm:p-3 bg-highlight/10 dark:bg-highlight/20 rounded-lg group-hover:bg-highlight/20 dark:group-hover:bg-highlight/30 transition-colors">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-highlight" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Logs e</p>
                    <p className="font-bold text-highlight text-base sm:text-lg truncate">Acessos</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Audite ações, acessos e atividades de todos os usuários.
                </p>
              </Link>
            </div>

            {/* Informações adicionais */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border border-primary/10 dark:border-primary/20 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary dark:text-primary-400 flex-shrink-0" />
                <span>
                  <strong className="text-primary dark:text-primary-400">Dica:</strong> Use o painel administrativo para 
                  gerenciar usuários, aprovar comissões e visualizar logs de auditoria.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ===== SEÇÃO FINANCEIRO (CEO/Financeiro) ===== */}
        {hasFinanceAccess && (
          <div className="mt-6 sm:mt-8 lg:mt-10 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl shadow-lg border-2 border-green-200 dark:border-green-700 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span>Área Financeira</span>
                  {isCEO && <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">CEO</span>}
                  {isFinanceiro && !isCEO && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">FINANCEIRO</span>}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mt-1">
                  Gestão completa de comissões e pagamentos
                </p>
              </div>
              <Link
                to="/financeiro"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                Acessar Financeiro
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
              Controle de comissões, pagamentos e relatórios financeiros do sistema.
            </p>

            {/* Cards de recursos financeiros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Card 1 - Comissões */}
              <Link
                to="/financeiro"
                className="group p-4 sm:p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/40 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gestão de</p>
                    <p className="font-bold text-green-600 dark:text-green-400 text-base sm:text-lg truncate">Comissões</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Visualize, aprove e marque comissões como pagas.
                </p>
              </Link>

              {/* Card 2 - Relatórios */}
              <Link
                to="/financeiro"
                className="group p-4 sm:p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Relatórios</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base sm:text-lg truncate">Financeiros</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Exporte dados financeiros e análises detalhadas.
                </p>
              </Link>
            </div>

            {/* Informações adicionais */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>
                  <strong className="text-green-700 dark:text-green-400">Importante:</strong> Esta área é exclusiva para gestão financeira, sem acesso às configurações administrativas.
                </span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
