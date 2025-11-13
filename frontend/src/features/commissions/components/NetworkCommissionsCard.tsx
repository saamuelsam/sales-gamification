// src/features/commissions/components/NetworkCommissionsCard.tsx
import { DollarSign, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface NetworkCommission {
  id: string;
  team_member_name: string;
  commission_type: string;
  percentage: number;
  amount: number;
  paid: boolean;
  created_at: string;
}

interface NetworkCommissionsCardProps {
  commissions: NetworkCommission[];
  summary?: any;
  onMarkAsPaid?: (id: string) => void;
  loading?: boolean;
}

export const NetworkCommissionsCard = ({
  commissions,
  summary,
  onMarkAsPaid,
  loading,
}: NetworkCommissionsCardProps) => {
  // ✅ FORMATAÇÃO CORRIGIDA
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Card>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Comissões de Rede
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {Array.isArray(commissions) ? commissions.length : 0} comissão{(Array.isArray(commissions) ? commissions.length : 0) !== 1 ? 'ões' : ''}
          </span>
        </div>

        {/* Resumo */}
        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
              <p className="text-xs text-gray-600 font-medium">Total</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600 mt-2">
                {formatCurrency(summary.total_earned || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.total_commissions || 0} comissão{(summary.total_commissions || 0) !== 1 ? 'ões' : ''}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
              <p className="text-xs text-gray-600 font-medium">Pagas</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 mt-2">
                {formatCurrency(summary.total_paid || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.paid_commissions || 0} paga{(summary.paid_commissions || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-100">
              <p className="text-xs text-gray-600 font-medium">Pendentes</p>
              <p className="text-lg sm:text-xl font-bold text-orange-600 mt-2">
                {formatCurrency(summary.total_pending || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.unpaid_commissions || 0} pendente{(summary.unpaid_commissions || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t my-6"></div>

        {/* Lista de Comissões - ✅ VERSÃO SEGURA */}
        {!Array.isArray(commissions) || commissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p className="text-sm">Nenhuma comissão de rede</p>
            <p className="text-xs text-gray-400 mt-1">
              Suas comissões aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:shadow-sm border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {commission.team_member_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {commission.commission_type === 'sales' ? '📊 Vendas' : '⭐ Pontos'}
                    </span>
                    <span className="text-xs text-gray-400">
                      • {commission.percentage}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(commission.amount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full mt-1 font-medium ${
                        commission.paid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {commission.paid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Paga
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Pendente
                        </>
                      )}
                    </span>
                  </div>

                  {!commission.paid && (
                    <button
                      onClick={() => onMarkAsPaid?.(commission.id)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 hover:scale-110"
                      title="Marcar como paga"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
