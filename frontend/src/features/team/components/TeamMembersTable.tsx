import { Card } from '@/components/ui/Card';
import { Users, Trash2, Mail, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  total_points: number;
  total_sales: number;
  total_revenue?: number;
  sales_count?: number;
  is_active?: boolean;
  created_at?: string;
}

interface TeamMembersTableProps {
  members: TeamMember[];
  onMemberRemoved?: () => void;
}

export const TeamMembersTable = ({ members, onMemberRemoved }: TeamMembersTableProps) => {
  const [loading, setLoading] = useState(false);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName} da sua equipe?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/users/team/members/${memberId}`);
      toast.success(`${memberName} removido da equipe`);
      onMemberRemoved?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Minha Equipe</h3>
            <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              ({members.length} {members.length === 1 ? 'membro' : 'membros'})
            </span>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Nenhum membro na equipe ainda</p>
            <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm mt-1">Clique em "Adicionar Membro" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Pontos</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Vendas</th>
                  <th className="text-right py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Receita</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Ação</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {member.email}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4 text-amber-500 hidden sm:inline" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {member.total_points.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                        {member.sales_count || member.total_sales}
                      </span>
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(member.total_revenue || 0)}
                      </span>
                    </td>

                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        disabled={loading}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Remover da equipe"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};
