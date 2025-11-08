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
    monthlyData, // ✅ Dados mensais do backend
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
      icon: <Users className="w-6 h-6" />,
      label: 'Membros Ativos',
      value: stats?.total_members || 0,
      color: 'primary',
      bgColor: 'from-primary/10 to-primary/5',
      textColor: 'text-primary',
      borderColor: 'border-primary/20',
      trend: '+3 este mês',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Total de Vendas',
      value: stats?.total_team_sales_count || 0,
      color: 'accent',
      bgColor: 'from-accent/10 to-accent/5',
      textColor: 'text-accent',
      borderColor: 'border-accent/20',
      trend: '+18% esta semana',
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: 'Pontos da Equipe',
      value: (stats?.total_team_points || 0).toLocaleString('pt-BR'),
      color: 'highlight',
      bgColor: 'from-highlight/10 to-highlight/5',
      textColor: 'text-highlight',
      borderColor: 'border-highlight/20',
      trend: 'Crescimento constante',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Faturamento',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }).format(stats?.total_team_sales || 0),
      color: 'green',
      bgColor: 'from-green-100 to-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      trend: '+25% este mês',
    },
  ];

  const commissionCards = [
    {
      icon: <Zap className="w-6 h-6" />,
      label: 'Comissões Totais',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary?.total_earned || 0),
      bgColor: 'from-purple-100 to-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Pagas',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary?.total_paid || 0),
      bgColor: 'from-green-100 to-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Pendentes',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary?.total_unpaid || 0),
      bgColor: 'from-orange-100 to-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-accent/5 p-3 sm:p-6 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ===== HEADER PREMIUM ===== */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Minha Equipe</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Gerencie sua rede e acompanhe o desempenho em tempo real
            </p>
          </div>
          <div className="mt-3 sm:mt-0 text-right">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Líder</span>
            <p className="font-semibold text-primary text-lg">{user?.name || 'Samuel Anselmo'}</p>
            <span className="text-xs text-accent font-medium">{user?.role || 'Elite'}</span>
          </div>
        </div>

        {/* ===== ESTATÍSTICAS DA EQUIPE ===== */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-4">Desempenho da Equipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bgColor} rounded-xl p-5 shadow-sm hover:shadow-md transition-all border ${card.borderColor}`}
              >
                <div className={`absolute top-2 right-2 opacity-10 ${card.textColor}`}>
                  <div className="w-16 h-16 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>

                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                  {card.value}
                </p>

                {card.trend && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {card.trend}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== BARRA DE PROGRESSO DA META ===== */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Target className="w-5 h-5" />
              Meta de Faturamento
            </h2>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% concluído
            </span>
          </div>
          <div className="w-full bg-gray-200 h-5 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-sm">
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
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Top 3 da Semana
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topMembers.map((member, index) => (
                <div
                  key={member.id}
                  className={`bg-white border-2 rounded-xl p-5 text-center shadow-sm hover:shadow-lg transition-all ${index === 0
                      ? 'border-accent bg-gradient-to-br from-accent/5 to-transparent'
                      : index === 1
                        ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-transparent'
                        : 'border-highlight/30 bg-gradient-to-br from-highlight/5 to-transparent'
                    }`}
                >
                  <div className="relative inline-block mb-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${index === 0 ? 'bg-accent text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                          'bg-highlight text-white'
                      }`}>
                      #{index + 1}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="text-2xl">👑</span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-lg text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500 mb-2">{member.role || 'Consultor'}</p>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-bold text-primary">Lista de Membros</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar membro..."
                  className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <AddMemberForm onMemberAdded={refresh} />

              <button
                onClick={refresh}
                disabled={teamLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${teamLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>

          <TeamMembersTable members={filteredMembers} onMemberRemoved={refresh} />
        </div>

        {/* ===== COMISSÕES ===== */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-highlight" />
            Minhas Comissões
          </h2>

          {/* Resumo de Comissões */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {commissionCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bgColor} rounded-xl p-5 shadow-sm border ${card.borderColor}`}
              >
                <div className={`absolute top-2 right-2 opacity-10 ${card.textColor}`}>
                  <div className="w-16 h-16 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className={`text-2xl font-bold mt-2 ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* ✅ Gráfico de Comissões - Dados Reais do Backend */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-primary mb-4">
              Comissões Recebidas (Últimos 6 Meses)
            </h3>
            {commissionsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={commissionsChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(value)
                    }
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p className="text-sm">Nenhuma comissão registrada nos últimos 6 meses</p>
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
