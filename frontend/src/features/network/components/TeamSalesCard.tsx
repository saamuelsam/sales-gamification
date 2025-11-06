// src/features/network/components/TeamSalesCard.tsx (MELHORADO)
import { User, DollarSign, TrendingUp, Calendar, Eye, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useTeamSales } from '../hooks/useTeamSales';

const statusColors: { [key: string]: string } = {
  'negotiation': 'bg-yellow-100 text-yellow-800',
  'pending': 'bg-blue-100 text-blue-800',
  'approved': 'bg-green-100 text-green-800',
  'financing_denied': 'bg-red-100 text-red-800',
  'cancelled': 'bg-gray-100 text-gray-800',
  'delivered': 'bg-green-200 text-green-900',
};

const statusLabels: { [key: string]: string } = {
  'negotiation': '🔄 Negociação',
  'pending': '⏳ Pendente',
  'approved': '✅ Aprovada',
  'financing_denied': '❌ Fin. Negado',
  'cancelled': '🚫 Cancelada',
  'delivered': '📦 Entregue',
};

const formatCurrency = (value: any) => {
  const num = parseFloat(value || 0);
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

interface SaleDetail {
  id: string;
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  status: string;
  created_at: string;
}

export const TeamSalesCard = () => {
  const { sales, loading, error } = useTeamSales();
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando vendas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ Erro: {error}
        </div>
      </div>
    );
  }

  const approvedSales = sales.filter(s => s.status === 'approved');
  const pendingSales = sales.filter(s => s.status === 'pending');
  const totalCommission = approvedSales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumo Rápido */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Total de Vendas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{sales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-600">Aprovadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedSales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-600">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingSales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-600">Comissões</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {formatCurrency(totalCommission)}
          </p>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold">Vendas da Equipe</h3>
            <span className="ml-auto text-sm text-gray-500">
              {sales.length} venda{sales.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p>Nenhuma venda na equipe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Membro</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="px-4 py-3 text-right font-semibold">kW</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Comissão</th>
                  <th className="px-4 py-3 text-center font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium">{sale.member_name}</div>
                      <div className="text-xs text-gray-500">{sale.member_email}</div>
                    </td>
                    <td className="px-4 py-3">{sale.client_name}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(sale.value)}
                    </td>
                    <td className="px-4 py-3 text-right">{sale.kilowatts} kW</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[sale.status] || 'bg-gray-100'
                      }`}>
                        {statusLabels[sale.status] || sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(sale.commission_amount)}
                      </div>
                      {sale.status === 'approved' && (
                        <span className="text-xs text-green-600">✅ Gerada</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setOpenDetail(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {openDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Detalhes da Venda</h3>
              <button
                onClick={() => setOpenDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">Cliente</p>
                <p className="text-sm font-medium">{selectedSale.client_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Valor</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedSale.value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">kW</p>
                  <p className="text-lg font-bold">{selectedSale.kilowatts}</p>
                </div>
              </div>
              {selectedSale.insurance_value && (
                <div>
                  <p className="text-xs text-gray-600">Seguro</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(selectedSale.insurance_value)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                  statusColors[selectedSale.status]
                }`}>
                  {statusLabels[selectedSale.status]}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-600">Data</p>
                <p className="text-sm font-medium">
                  {new Date(selectedSale.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpenDetail(false)}
              className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
