import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CommissionData {
  id: string;
  leader_name: string;
  team_member_name: string;
  commission_amount: number;
  paid: boolean;
  created_at: string;
}

interface CommissionSummary {
  total_commissions: number;
  total_earned: number;
  total_paid: number;
  total_unpaid: number;
}

export function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/commissions', {
        params: { status, search: filter },
      });
      setCommissions(res.data?.data || []);
      setSummary(res.data?.summary || null);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await api.patch(`/admin/commissions/${id}/paid`);
      toast.success('Comissão marcada como paga');
      fetchCommissions();
    } catch {
      toast.error('Erro ao atualizar comissão');
    }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/admin/commissions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_comissoes.csv');
      document.body.appendChild(link);
      link.click();
      toast.success('CSV exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar CSV');
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Comissões</h1>
          <p className="text-gray-600 text-sm">Acompanhe e gerencie as comissões da rede</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar líder ou consultor..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            onClick={fetchCommissions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar
          </button>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-3">
        {(['all', 'paid', 'unpaid'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              status === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {key === 'all'
              ? 'Todas'
              : key === 'paid'
              ? 'Pagas'
              : 'Pendentes'}
          </button>
        ))}
      </div>

      {/* Resumo de Comissões */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total de Comissões</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{summary.total_commissions}</p>
            </div>
            <DollarSign className="w-6 h-6 text-gray-500" />
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Valor Total</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                R$ {summary.total_earned.toLocaleString('pt-BR')}
              </p>
            </div>
            <DollarSign className="w-6 h-6 text-blue-600" />
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pagas</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                R$ {summary.total_paid.toLocaleString('pt-BR')}
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pendentes</p>
              <p className="text-xl font-bold text-orange-600 mt-1">
                R$ {summary.total_unpaid.toLocaleString('pt-BR')}
              </p>
            </div>
            <Clock className="w-6 h-6 text-orange-600" />
          </Card>
        </div>
      )}

      {/* Lista de Comissões */}
      <Card className="p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-3 text-left font-semibold">Líder</th>
              <th className="p-3 text-left font-semibold">Consultor</th>
              <th className="p-3 text-center font-semibold">Valor</th>
              <th className="p-3 text-center font-semibold">Status</th>
              <th className="p-3 text-center font-semibold">Data</th>
              <th className="p-3 text-center font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{c.leader_name}</td>
                <td className="p-3">{c.team_member_name}</td>
                <td className="p-3 text-center text-green-600 font-semibold">
                  R$ {c.commission_amount.toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      c.paid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {c.paid ? 'Paga' : 'Pendente'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-3 text-center">
                  {!c.paid && (
                    <button
                      onClick={() => markAsPaid(c.id)}
                      disabled={loading}
                      className="p-2 rounded-md hover:bg-gray-100 transition disabled:opacity-50"
                      title="Marcar como paga"
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {commissions.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma comissão encontrada</p>
          </div>
        )}
      </Card>
    </div>
  );
}
