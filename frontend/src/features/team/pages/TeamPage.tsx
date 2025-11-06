// src/features/team/pages/TeamPage.tsx
import { useTeam } from '../hooks/useTeam';
import { useCommissions } from '@/features/commissions/hooks/useCommissions';
import { Loading } from '@/components/ui/Loading';
import { TeamMembersTable } from '../components/TeamMembersTable';
import { AddMemberForm } from '../components/AddMemberForm';
import { NetworkCommissionsCard } from '@/features/commissions/components/NetworkCommissionsCard';
import { Users, TrendingUp, DollarSign, Award, Zap, Clock } from 'lucide-react';



export function TeamPage() {
  const { members, stats, loading: teamLoading, refresh } = useTeam();
  const { commissions, summary, loading: commissionLoading, markAsPaid } = useCommissions();

  if (teamLoading) return <Loading />;

  const statCards = [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Membros',
      value: stats?.total_members || 0,
      color: 'blue',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Vendas da Equipe',
      value: stats?.total_team_sales_count || 0,
      color: 'green',
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: 'Pontos da Equipe',
      value: (stats?.total_team_points || 0).toLocaleString('pt-BR'),
      color: 'amber',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Faturamento',
      value: `R$ ${(stats?.total_team_sales || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      color: 'emerald',
    },
  ];

  // Cards de comissões
  const commissionCards = [
    {
      icon: <Zap className="w-6 h-6" />,
      label: 'Comissões Totais',
      value: `R$ ${(summary?.total_earned || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`,
      color: 'purple',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Pagas',
      value: `R$ ${(summary?.total_paid || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`,
      color: 'green',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Pendentes',
      value: `R$ ${(summary?.total_pending || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`,
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-green-50 to-green-100',
    amber: 'from-amber-50 to-amber-100',
    emerald: 'from-emerald-50 to-emerald-100',
    purple: 'from-purple-50 to-purple-100',
    orange: 'from-orange-50 to-orange-100',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* ===== HEADER ===== */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Minha Equipe
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Gerencie e acompanhe o desempenho dos seus membros e comissões
          </p>
        </div>

        {/* ===== ESTATÍSTICAS DA EQUIPE ===== */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Desempenho da Equipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${colorClasses[card.color as keyof typeof colorClasses]} rounded-lg p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">{card.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className="text-gray-400 opacity-50">{card.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== MEMBROS DA EQUIPE ===== */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Membros da Equipe</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <AddMemberForm onMemberAdded={refresh} />
              <button
                onClick={refresh}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                title="Atualizar dados"
              >
                🔄
              </button>
            </div>
          </div>
          <TeamMembersTable members={members} onMemberRemoved={refresh} />
        </div>

        {/* ===== COMISSÕES DE REDE ===== */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Minhas Comissões</h2>
          
          {/* Resumo de Comissões */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {commissionCards.map((card, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${colorClasses[card.color as keyof typeof colorClasses]} rounded-lg p-4 sm:p-6 border border-gray-200`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">{card.label}</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className="text-gray-400 opacity-50">{card.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Card de Comissões Detalhado */}
          <NetworkCommissionsCard
            commissions={commissions}
            summary={summary}
            onMarkAsPaid={markAsPaid}
            loading={commissionLoading}
          />
        </div>
      </div>
    </div>
  );
}
