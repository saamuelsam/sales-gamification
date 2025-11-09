// src/features/team/pages/TeamPage.tsx
import { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import { useCommissions } from '@/features/commissions/hooks/useCommissions';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui/Loading';
import { TeamMembersTable } from '../components/TeamMembersTable';
import { AddMemberForm } from '../components/AddMemberForm';
import { NetworkCommissionsCard } from '@/features/commissions/components/NetworkCommissionsCard';
import {
  Users,
  TrendingUp,
  DollarSign,
  Award,
  Zap,
  Clock,
  Target,
  Search,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function TeamPage() {
  const { user } = useAuthStore();
  const { members, stats, loading: teamLoading, refresh } = useTeam();
  const {
    commissions,
    summary,
    monthlyData,
    loading: commissionLoading,
    markAsPaid
  } = useCommissions();
  const [search, setSearch] = useState('');

  if (teamLoading && !members?.length) return <Loading />;

  // ✅ Usar dados reais do backend
  const commissionsChartData = monthlyData.length > 0
    ? monthlyData.map(c => ({
      month: c.month,
      amount: Number(c.amount || 0),
    }))
    : [];

  // Meta de faturamento
  const goalAmount = 100000;
  const currentRevenue = stats?.total_team_sales || 0;
  const progressPercentage = Math.min((currentRevenue / goalAmount) * 100, 100);

  // Top 3 membros
  const topMembers = [...(members || [])]
    .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
    .slice(0, 3);

  // Filtrar membros
  const filteredMembers = members?.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const statCards = [
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Membros Ativos',
      value: stats?.total_members || 0,
      bgColor: 'from-primary/10 to-primary/5',
      textColor: 'text-primary',
      borderColor: 'border-primary/20',
      trend: '+3 este mês',
    },
    {
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Total de Vendas',
      value: stats?.total_team_sales_count || 0,
      bgColor: 'from-accent/10 to-accent/5',
      textColor: 'text-accent',
      borderColor: 'border-accent/20',
      trend: '+18% esta semana',
    },
    {
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Pontos da Equipe',
      value: (stats?.total_team_points || 0).toLocaleString('pt-BR'),
      bgColor: 'from-highlight/10 to-highlight/5',
      textColor: 'text-highlight',
      borderColor: 'border-highlight/20',
      trend: 'Crescimento',
    },
    {
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Faturamento',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }).format(stats?.total_team_sales || 0),
      bgColor: 'from-green-100 to-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      trend: '+25% este mês',
    },
  ];

  const commissionCards = [
    {
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Comissões Totais',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }).format(summary?.total_earned || 0),
      bgColor: 'from-purple-100 to-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Pagas',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }).format(summary?.total_paid || 0),
      bgColor: 'from-green-100 to-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Pendentes',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }).format(summary?.total_unpaid || 0),
      bgColor: 'from-orange-100 to-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-accent/5 p-2 xs:p-3 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ===== HEADER PREMIUM ===== */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Minha Equipe</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">
              Gerencie sua rede e acompanhe o desempenho
            </p>
          </div>
          <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Líder</span>
            <p className="font-semibold text-primary text-base sm:text-lg">{user?.name || 'Samuel Anselmo'}</p>
            <span className="text-xs text-accent font-medium">{user?.role || 'Elite'}</span>
          </div>
        </div>

        {/* ===== ESTATÍSTICAS DA EQUIPE ===== */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4 px-1">Desempenho da Equipe</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bgColor} rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all border ${card.borderColor}`}
              >
                {/* Ícone de fundo translúcido */}
                <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 opacity-10 ${card.textColor}`}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.label}</p>
                <p className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 ${card.textColor} truncate`}>
                  {card.value}
                </p>

                {/* Indicador de tendência */}
                {card.trend && (
                  <p className="text-xs text-green-600 mt-1 sm:mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{card.trend}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== BARRA DE PROGRESSO DA META ===== */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-3">
            <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Meta de Faturamento</span>
            </h2>
            <span className="text-xs sm:text-sm text-gray-500">
              {Math.round(progressPercentage)}% concluído
            </span>
          </div>
          <div className="w-full bg-gray-200 h-4 sm:h-5 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mt-2 text-xs sm:text-sm">
            <p className="text-gray-600">
              <strong className="text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0
                }).format(currentRevenue)}
              </strong>
              {' '}de{' '}
              <strong className="text-gray-700">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0
                }).format(goalAmount)}
              </strong>
            </p>
            <p className="text-accent font-semibold">
              Faltam{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(Math.max(0, goalAmount - currentRevenue))}
            </p>
          </div>
        </div>

        {/* ===== TOP 3 DA SEMANA ===== */}
        {topMembers.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4 flex items-center gap-2 px-1">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              Top 3 da Semana
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {topMembers.map((member, index) => (
                <div
                  key={member.id}
                  className={`bg-white border-2 rounded-lg sm:rounded-xl p-4 sm:p-5 text-center shadow-sm hover:shadow-lg transition-all ${
                    index === 0
                      ? 'border-accent bg-gradient-to-br from-accent/5 to-transparent'
                      : index === 1
                      ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-transparent'
                      : 'border-highlight/30 bg-gradient-to-br from-highlight/5 to-transparent'
                  }`}
                >
                  <div className="relative inline-block mb-3">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold ${
                      index === 0 ? 'bg-accent text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      'bg-highlight text-white'
                    }`}>
                      #{index + 1}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="text-xl sm:text-2xl">👑</span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-base sm:text-lg text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 truncate">{member.role || 'Consultor'}</p>
                  <div className="flex justify-center gap-4 text-xs">
                    <div>
                      <p className="text-gray-600">Vendas</p>
                      <p className="font-semibold text-primary">{member.total_sales || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pontos</p>
                      <p className="font-semibold text-accent">{member.total_points || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MEMBROS DA EQUIPE ===== */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-primary">Lista de Membros</h2>
            <div className="flex flex-col xs:flex-row gap-2">
              {/* Campo de busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar membro..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 xs:flex-initial">
                  <AddMemberForm onMemberAdded={refresh} />
                </div>

                <button
                  onClick={refresh}
                  disabled={teamLoading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${teamLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Atualizar</span>
                </button>
              </div>
            </div>
          </div>

          <TeamMembersTable members={filteredMembers} onMemberRemoved={refresh} />
        </div>

        {/* ===== COMISSÕES ===== */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-3 sm:mb-4 flex items-center gap-2 px-1">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-highlight" />
            Minhas Comissões
          </h2>

          {/* Resumo de Comissões */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {commissionCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bgColor} rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm border ${card.borderColor}`}
              >
                <div className={`absolute top-2 right-2 opacity-10 ${card.textColor}`}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.label}</p>
                <p className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 sm:mt-2 ${card.textColor} truncate`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* ✅ Gráfico de Comissões - Dados Reais do Backend */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-primary mb-3 sm:mb-4">
              Comissões Recebidas (Últimos 6 Meses)
            </h3>
            {commissionsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                <BarChart data={commissionsChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="sm:text-xs" />
                  <YAxis tick={{ fontSize: 10 }} className="sm:text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0
                      }).format(value)
                    }
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400">
                <p className="text-xs sm:text-sm text-center px-4">Nenhuma comissão registrada nos últimos 6 meses</p>
              </div>
            )}
          </div>

          {/* Card de Comissões Detalhado */}
          <NetworkCommissionsCard
            commissions={commissions as any}
            summary={summary}
            onMarkAsPaid={markAsPaid}
            loading={commissionLoading}
          />
        </div>
      </div>
    </div>
  );
}
