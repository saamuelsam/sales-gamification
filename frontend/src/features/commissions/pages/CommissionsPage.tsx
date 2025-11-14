import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  Clock,
  CheckCircle,
  Filter,
  Search,
  Download,
  Eye,
  RefreshCw,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface PersonalCommission {
  id: string;
  sale_id: string;
  commission_percentage: number;
  commission_amount: number;
  points: number;
  paid: boolean;
  created_at: string;
  client_name?: string;
  sale_value?: number;
}

interface NetworkCommission {
  id: string;
  team_member_name: string;
  team_member_email: string;
  sale_id: string;
  commission_percentage: number;
  commission_amount: number;
  line_level: number;
  paid: boolean;
  created_at: string;
  client_name?: string;
  sale_value?: number;
}

interface Summary {
  personal: {
    total_earned: number;
    total_paid: number;
    total_unpaid: number;
    total_commissions?: number;
  };
  network: {
    total_earned: number;
    total_paid: number;
    total_unpaid: number;
    total_commissions?: number;
  };
  total_earned: number;
  total_paid: number;
  total_pending: number;
}

interface MonthlyData {
  month: string;
  amount: number;
}

export default function CommissionsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [personalCommissions, setPersonalCommissions] = useState<PersonalCommission[]>([]);
  const [networkCommissions, setNetworkCommissions] = useState<NetworkCommission[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'network'>('personal');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

      const [summaryRes, personalRes, networkRes, monthlyRes] = await Promise.all([
        fetch(`${baseURL}/commissions/summary`, { headers }),
        fetch(`${baseURL}/commissions/personal`, { headers }),
        fetch(`${baseURL}/commissions/network`, { headers }),
        fetch(`${baseURL}/commissions/monthly`, { headers })
      ]);

      const summaryData = await summaryRes.json();
      const personalData = await personalRes.json();
      const networkData = await networkRes.json();
      const monthlyDataRes = await monthlyRes.json();

      if (summaryData.success) setSummary(summaryData.data);
      if (personalData.success) {
        // Converter sale_value para número
        const parsedPersonal = personalData.data.map((c: PersonalCommission) => ({
          ...c,
          sale_value: parseFloat(c.sale_value as any) || 0,
          commission_amount: parseFloat(c.commission_amount as any) || 0,
          points: parseFloat(c.points as any) || 0
        }));
        setPersonalCommissions(parsedPersonal);
      }
      if (networkData.success) {
        // Converter sale_value para número
        const parsedNetwork = networkData.data.map((c: NetworkCommission) => ({
          ...c,
          sale_value: parseFloat(c.sale_value as any) || 0,
          commission_amount: parseFloat(c.commission_amount as any) || 0
        }));
        setNetworkCommissions(parsedNetwork);
      }
      if (monthlyDataRes.success) {
        // Formatar dados para o gráfico
        const formatted = monthlyDataRes.data.map((item: MonthlyData) => ({
          month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          amount: item.amount
        }));
        setMonthlyData(formatted);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados de comissões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const data = activeTab === 'personal' ? filteredPersonal : filteredNetwork;
    const headers = activeTab === 'personal'
      ? ['Data', 'Cliente', 'Valor Venda', 'Percentual', 'Comissão', 'Pontos', 'Status']
      : ['Data', 'Vendedor', 'Cliente', 'Valor Venda', 'Percentual', 'Comissão', 'Nível', 'Status'];

    const rows = data.map(item => {
      if (activeTab === 'personal') {
        const p = item as PersonalCommission;
        return [
          new Date(p.created_at).toLocaleDateString('pt-BR'),
          p.client_name || 'N/A',
          `R$ ${(p.sale_value || 0).toFixed(2)}`,
          `${p.commission_percentage}%`,
          `R$ ${p.commission_amount.toFixed(2)}`,
          `${p.points} kW`,
          p.paid ? 'Paga' : 'Pendente'
        ];
      } else {
        const n = item as NetworkCommission;
        return [
          new Date(n.created_at).toLocaleDateString('pt-BR'),
          n.team_member_name,
          n.client_name || 'N/A',
          `R$ ${(n.sale_value || 0).toFixed(2)}`,
          `${n.commission_percentage}%`,
          `R$ ${n.commission_amount.toFixed(2)}`,
          `Nível ${n.line_level}`,
          n.paid ? 'Paga' : 'Pendente'
        ];
      }
    });

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comissoes_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exportado com sucesso');
  };

  const filteredPersonal = personalCommissions.filter(c => {
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'paid' && c.paid) || 
      (filterStatus === 'pending' && !c.paid);
    const matchSearch = c.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredNetwork = networkCommissions.filter(c => {
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'paid' && c.paid) || 
      (filterStatus === 'pending' && !c.paid);
    const matchSearch = 
      c.team_member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando comissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Minhas Comissões
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Acompanhe seus ganhos e histórico de comissões
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Ganho</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {(summary?.total_earned || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Pessoal + Rede
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Comissões Pagas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {(summary?.total_paid || 0).toFixed(2)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            ✓ Recebidas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {(summary?.total_pending || 0).toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            ⏳ Aguardando pagamento
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Comissões de Rede</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            R$ {(summary?.network?.total_earned || 0).toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            Da sua equipe
          </p>
        </div>
      </div>

      {/* Breakdown: Personal vs Network */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Personal Commissions Summary */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 dark:bg-green-500 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Comissões Pessoais</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suas vendas diretas</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Total ganho:</span>
              <span className="font-bold text-green-700 dark:text-green-400">
                R$ {(summary?.personal?.total_earned || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Já recebido:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                R$ {(summary?.personal?.total_paid || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Pendente:</span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                R$ {(summary?.personal?.total_unpaid || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Network Commissions Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Comissões de Rede</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vendas da sua equipe</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Total ganho:</span>
              <span className="font-bold text-purple-700 dark:text-purple-400">
                R$ {(summary?.network?.total_earned || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Já recebido:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                R$ {(summary?.network?.total_paid || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Pendente:</span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                R$ {(summary?.network?.total_unpaid || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Evolução Mensal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Últimos 6 meses de comissões
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Comissões']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'personal'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                Pessoais ({personalCommissions.length})
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'network'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Rede ({networkCommissions.length})
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="paid">Pagas</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="overflow-x-auto">
          {activeTab === 'personal' ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Venda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pontos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonal.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {commission.client_name || 'Cliente'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      R$ {(commission.sale_value || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {commission.commission_percentage}%
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                      R$ {commission.commission_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {commission.points} kW
                    </td>
                    <td className="px-6 py-4">
                      {commission.paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Paga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Venda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nível</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNetwork.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {commission.team_member_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {commission.team_member_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {commission.client_name || 'Cliente'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      R$ {(commission.sale_value || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {commission.commission_percentage}%
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-purple-600 dark:text-purple-400">
                      R$ {commission.commission_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                        Nível {commission.line_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {commission.paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Paga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Empty State */}
        {((activeTab === 'personal' && filteredPersonal.length === 0) ||
          (activeTab === 'network' && filteredNetwork.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'personal' ? (
              <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            ) : (
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            )}
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Nenhuma comissão {activeTab === 'personal' ? 'pessoal' : 'de rede'} encontrada
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {activeTab === 'personal' 
                ? 'Faça vendas para começar a receber comissões pessoais'
                : 'Construa sua equipe para receber comissões de rede'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
