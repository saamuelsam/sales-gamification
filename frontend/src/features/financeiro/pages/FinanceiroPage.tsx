import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Commission {
  id: string;
  user_name?: string;
  user_email?: string;
  type: string;
  amount?: number;
  status: string;
  created_at: string;
}

interface PendingSale {
  id: string;
  value: number;
  kilowatts: number;
  status: string;
  created_at: string;
  notes?: string;
  client_name: string;
  client_id?: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  seller_role: string;
  client_cpf?: string;
  client_phone?: string;
  client_email?: string;
  seller_pending_count: number;
  seller_approved_count: number;
}

export default function FinanceiroPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'commissions' | 'approvals'>('commissions');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<PendingSale | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (activeTab === 'commissions') {
      fetchCommissions();
    } else {
      fetchPendingSales();
    }
  }, [activeTab]);

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      const response = await fetch(`${baseURL}/admin/commissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Garantir que os dados estão no formato correto
        const validCommissions = (data.data || []).map((c: any) => ({
          ...c,
          amount: parseFloat(c.amount) || 0,
          user_name: c.user_name || 'N/A',
          user_email: c.user_email || 'N/A'
        }));
        setCommissions(validCommissions);
      } else {
        toast.error(data.message || 'Erro ao carregar comissões');
      }
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      toast.error('Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      const response = await fetch(`${baseURL}/financial/pending-sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Garantir que os valores são números
        const validSales = (data.data || []).map((sale: any) => ({
          ...sale,
          value: parseFloat(sale.value) || 0,
          kilowatts: parseFloat(sale.kilowatts) || 0
        }));
        setPendingSales(validSales);
      } else {
        toast.error(data.message || 'Erro ao carregar vendas pendentes');
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSale = async () => {
    if (!selectedSale) return;
    
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      
      console.log('🔍 Aprovando venda:', {
        saleId: selectedSale.id,
        baseURL,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
      });
      
      const response = await fetch(`${baseURL}/financial/approve/${selectedSale.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: approvalNotes })
      });
      
      const data = await response.json();
      
      console.log('📡 Resposta do servidor:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      if (response.ok && data.success) {
        toast.success('Venda aprovada com sucesso!');
        setShowApproveModal(false);
        setSelectedSale(null);
        setApprovalNotes('');
        fetchPendingSales();
      } else {
        const errorMessage = data.message || `Erro ${response.status}: ${response.statusText}`;
        console.error('❌ Erro na resposta:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Erro ao aprovar venda:', error);
      toast.error(error.message || 'Erro ao aprovar venda');
    }
  };

  const handleRejectSale = async () => {
    if (!selectedSale || !rejectionReason || rejectionReason.length < 10) {
      toast.error('Por favor, forneça um motivo detalhado (mínimo 10 caracteres)');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      const response = await fetch(`${baseURL}/financial/reject/${selectedSale.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Venda rejeitada');
        setShowRejectModal(false);
        setSelectedSale(null);
        setRejectionReason('');
        fetchPendingSales();
      } else {
        toast.error(data.message || 'Erro ao rejeitar venda');
      }
    } catch (error) {
      console.error('Erro ao rejeitar venda:', error);
      toast.error('Erro ao rejeitar venda');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedSale || !newStatus) {
      toast.error('Por favor, selecione um status');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      const response = await fetch(`${baseURL}/sales/${selectedSale.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      if (data.success || response.ok) {
        toast.success('Status atualizado com sucesso');
        setShowStatusModal(false);
        setSelectedSale(null);
        setNewStatus('');
        fetchPendingSales();
      } else {
        toast.error(data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleMarkPaid = async (commissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
      const response = await fetch(`${baseURL}/admin/commissions/${commissionId}/paid`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Comissão marcada como paga');
        fetchCommissions();
      } else {
        toast.error(data.message || 'Erro ao atualizar comissão');
      }
    } catch (error) {
      toast.error('Erro ao processar pagamento');
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ['Usuário', 'Email', 'Tipo', 'Valor', 'Status', 'Data'],
      ...filteredCommissions.map(c => [
        c.user_name || 'N/A',
        c.user_email || 'N/A',
        c.type,
        `R$ ${(c.amount || 0).toFixed(2)}`,
        c.status,
        new Date(c.created_at).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comissoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exportado com sucesso');
  };

  const filteredCommissions = commissions.filter(c => {
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = (c.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (c.user_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: filteredCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
    pending: filteredCommissions.filter(c => c.status === 'pending').length,
    paid: filteredCommissions.filter(c => c.status === 'paid').length,
    users: new Set(filteredCommissions.map(c => c.user_email).filter(Boolean)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Área Financeira
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gestão de comissões e pagamentos
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('commissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'commissions'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Comissões
              </div>
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'approvals'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Aprovar Vendas
                {pendingSales.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {pendingSales.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === 'commissions' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total em Comissões</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                R$ {stats.total.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pagas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.paid}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.users}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Approval Sales Stats */}
      {activeTab === 'approvals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vendas Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {pendingSales.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total Pendente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingSales.reduce((sum, s) => sum + s.value, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vendedores Únicos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Set(pendingSales.map(s => s.seller_id)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {activeTab === 'commissions' && (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pagas
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Commissions Table */}
      {activeTab === 'commissions' && (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{commission.user_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{commission.user_email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {commission.type === 'personal' ? 'Pessoal' : 'Rede'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      R$ {(commission.amount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {commission.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Paga
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    {commission.status === 'pending' && (
                      <button
                        onClick={() => handleMarkPaid(commission.id)}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Marcar como Paga
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCommissions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma comissão encontrada</p>
          </div>
        )}
      </div>
      )}

      {/* Pending Sales Table */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingSales.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Nenhuma venda pendente de aprovação
              </p>
            </div>
          ) : (
            pendingSales.map((sale) => (
              <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {sale.client_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {sale.status === 'pending' ? '⏳ Pendente' : '💬 Negociação'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vendedor</p>
                        <p className="font-medium text-gray-900 dark:text-white">{sale.seller_name}</p>
                        <p className="text-xs text-gray-500">{sale.seller_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Valor</p>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Potência</p>
                        <p className="font-medium text-gray-900 dark:text-white">{sale.kilowatts} kW</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {sale.client_cpf && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dados do Cliente:</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">CPF:</span> <span className="text-gray-900 dark:text-white">{sale.client_cpf}</span>
                          </div>
                          {sale.client_phone && (
                            <div>
                              <span className="text-gray-500">Telefone:</span> <span className="text-gray-900 dark:text-white">{sale.client_phone}</span>
                            </div>
                          )}
                          {sale.client_email && (
                            <div>
                              <span className="text-gray-500">Email:</span> <span className="text-gray-900 dark:text-white">{sale.client_email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        📊 Este vendedor tem <strong>{sale.seller_pending_count} vendas pendentes</strong> e <strong>{sale.seller_approved_count} aprovadas</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setSelectedSale(sale);
                      setNewStatus(sale.status);
                      setShowStatusModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    Alterar Status
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowApproveModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprovar Venda
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeitar Venda
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Aprovação */}
      {showApproveModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ✅ Aprovar Venda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você está prestes a aprovar a venda de <strong>{selectedSale.client_name}</strong> no valor de <strong>R$ {selectedSale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Ex: Documentação conferida e aprovada..."
              />
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              ⚠️ Após aprovação, as comissões serão automaticamente liberadas para o vendedor e sua rede.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleApproveSale}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Confirmar Aprovação
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedSale(null);
                  setApprovalNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showRejectModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ❌ Rejeitar Venda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você está prestes a rejeitar a venda de <strong>{selectedSale.client_name}</strong> no valor de <strong>R$ {selectedSale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo da Rejeição (obrigatório) *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Ex: Documentação incompleta. Falta comprovante de residência do cliente..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              ⚠️ O vendedor será notificado com este motivo. Nenhuma comissão será gerada.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRejectSale}
                disabled={rejectionReason.length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Rejeição
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedSale(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alterar Status */}
      {showStatusModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🔄 Alterar Status da Venda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Venda de <strong>{selectedSale.client_name}</strong> no valor de <strong>R$ {selectedSale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Novo Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="negotiation">🔵 Negociação</option>
                <option value="pending">🟡 Pendente</option>
                <option value="approved">🟢 Aprovado</option>
                <option value="financing_denied">🔴 Financiamento Negado</option>
                <option value="cancelled">⚫ Cancelado</option>
                <option value="delivered">🟣 Entregue</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedSale(null);
                  setNewStatus('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
