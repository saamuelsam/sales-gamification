// src/features/team/components/CommissionsCard.tsx
import { DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Commission {
  id: string;
  member_name: string;
  commission_type: string;
  percentage: number;
  amount: number;
  created_at: string;
}

interface CommissionsCardProps {
  commissions: Commission[];
  summary?: any;
}

export const CommissionsCard = ({ commissions }: CommissionsCardProps) => {
  const totalCommissions = commissions.reduce((acc, c) => acc + c.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Minhas Comissões de Rede</h3>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-gray-600">Total em Comissões</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(totalCommissions)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-gray-600">Transações</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{commissions.length}</p>
          </div>
        </div>

        {/* Lista de Comissões */}
        {commissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p>Nenhuma comissão ainda</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commissions.slice(0, 10).map((commission) => (
              <div key={commission.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {commission.member_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {commission.commission_type === 'sales' ? '📊 Venda' : '⭐ Pontos'} ({commission.percentage}%)
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0">
                  +{formatCurrency(commission.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
