import { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import { useCommissions } from '@/features/commissions/hooks/useCommissions';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/ui/Loading';
import { TeamMembersTable } from '../components/TeamMembersTable';
import { AddMemberForm } from '../components/AddMemberForm';
import {
  Users,
  TrendingUp,
  Award,
  Search,
  RefreshCw,
  DollarSign
} from 'lucide-react';

export function TeamPage() {
  const { user } = useAuthStore();
  const { members, stats, loading: teamLoading, refresh } = useTeam();
  const { summary, loading: commissionLoading } = useCommissions();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'network'>('personal');

  if (teamLoading && !members?.length) return <Loading />;

  // Filtrar membros
  const filteredMembers =
    members?.filter(
      (m) =>
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
      trend: '+3 este mês'
    },
    {
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Total de Vendas',
      value: stats?.total_team_sales_count || 0,
      bgColor: 'from-accent/10 to-accent/5',
      textColor: 'text-accent',
      borderColor: 'border-accent/20',
      trend: '+18% esta semana'
    },
    {
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: 'Pontos da Equipe',
      value: (stats?.total_team_points || 0).toLocaleString('pt-BR'),
      bgColor: 'from-highlight/10 to-highlight/5',
      textColor: 'text-highlight',
      borderColor: 'border-highlight/20',
      trend: 'Crescimento'
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
      trend: '+25% este mês'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-accent/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-2 xs:p-3 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* ===== HEADER ===== */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary dark:text-white">Minha Equipe</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm md:text-base">
              Gerencie sua rede e acompanhe o desempenho
            </p>
          </div>
          <div className="text-left sm:text-right border-t dark:border-gray-700 sm:border-t-0 pt-3 sm:pt-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Líder</span>
            <p className="font-semibold text-primary dark:text-white text-base sm:text-lg">{user?.name}</p>
            <span className="text-xs text-accent dark:text-accent-400 font-medium">{user?.role}</span>
          </div>
        </div>

        {/* ===== ESTATÍSTICAS ===== */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-white mb-3 sm:mb-4 px-1">
            Desempenho da Equipe
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bgColor} rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all border ${card.borderColor}`}
              >
                <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 opacity-10 ${card.textColor}`}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{card.label}</p>
                <p
                  className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 ${card.textColor} truncate`}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ABA DE COMISSÕES ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
            <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Comissões
            </h2>
            <div className="flex gap-2 text-sm font-medium">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Pessoais
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'network'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Rede
              </button>
            </div>
          </div>

          {/* Conteúdo dinâmico */}
          {commissionLoading ? (
            <Loading />
          ) : activeTab === 'personal' ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Suas comissões pessoais por vendas diretas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Ganho</p>
                  <p className="text-xl font-bold text-green-600">
                    {summary?.personal
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(summary.personal.total_earned || 0)
                      : 'R$ 0,00'}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {summary?.personal
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(summary.personal.total_unpaid || 0)
                      : 'R$ 0,00'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pagas</p>
                  <p className="text-xl font-bold text-blue-600">
                    {summary?.personal
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(summary.personal.total_paid || 0)
                      : 'R$ 0,00'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comissões de rede geradas pelas vendas dos consultores da sua equipe.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Rede</p>
                  <p className="text-xl font-bold text-purple-600">
                    {summary?.network
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(summary.network.total_earned || 0)
                      : 'R$ 0,00'}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {summary?.network
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(summary.network.total_unpaid || 0)
                      : 'R$ 0,00'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pagas</p>
                  <p className="text-xl font-bold text-blue-600">
                    {summary?.network
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(summary.network.total_paid || 0)
                      : 'R$ 0,00'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== MEMBROS DA EQUIPE ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b dark:border-gray-700 flex flex-col gap-3">
            <h2 className="text-base sm:text-lg font-bold text-primary dark:text-white">Lista de Membros</h2>
            <div className="flex flex-col xs:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar membro..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 xs:flex-initial">
                  <AddMemberForm onMemberAdded={refresh} />
                </div>
                <button
                  onClick={refresh}
                  disabled={teamLoading}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${teamLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Atualizar</span>
                </button>
              </div>
            </div>
          </div>

          <TeamMembersTable members={filteredMembers} onMemberRemoved={refresh} />
        </div>
      </div>
    </div>
  );
}
