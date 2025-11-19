import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  QrCode, 
  CheckCircle, 
  Clock, 
  User, 
  AlertTriangle,
  Search,
  Eye,
  Banknote,
  History,
  Copy,
  Check,
  FileText,
  Building2,
  ChevronRight,
  X,
  Info
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface PendingCommission {
  user_id: string;
  user_name: string;
  user_email: string;
  pix_type: string | null;
  pix_key: string | null;
  pix_verified: boolean;
  total_personal: number;
  total_network: number;
  total_amount: number;
  commissions_count: number;
  oldest_commission: string;
  latest_commission: string;
}

interface CommissionDetail {
  id: string;
  type: 'personal' | 'network';
  sale_id: string;
  sale_value: number;
  commission_percentage: number;
  commission_amount: number;
  sale_date: string;
  client_name: string;
}

interface UserBankData {
  name: string;
  email: string;
  phone: string | null;
  pix_type: string | null;
  pix_key: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
}

interface PaymentData {
  payment_id: string;
  user_name: string;
  amount: number;
  pix_key: string;
  pix_type: string;
  qr_code: string;
  created_at: string;
  commission_ids: string[];
}

export const CommissionPaymentsPage = () => {
  // Estados principais
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<PendingCommission[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingCommission | null>(null);
  const [commissionDetails, setCommissionDetails] = useState<CommissionDetail[]>([]);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [userBankData, setUserBankData] = useState<UserBankData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPixStatus, setFilterPixStatus] = useState<'all' | 'with_pix' | 'without_pix'>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPendingCommissions();
  }, []);

  useEffect(() => {
    filterCommissions();
  }, [searchTerm, filterPixStatus, pendingCommissions]);

  const loadPendingCommissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/commission-payments/pending');
      const data = (response.data.data || []).map((item: any) => ({
        ...item,
        total_personal: parseFloat(item.total_personal) || 0,
        total_network: parseFloat(item.total_network) || 0,
        total_amount: parseFloat(item.total_amount) || 0,
      }));
      setPendingCommissions(data);
    } catch (error) {
      console.error('Erro ao carregar comissões pendentes:', error);
      toast.error('Erro ao carregar comissões pendentes');
    } finally {
      setLoading(false);
    }
  };

  const filterCommissions = () => {
    let filtered = [...pendingCommissions];

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPixStatus === 'with_pix') {
      filtered = filtered.filter(c => c.pix_key);
    } else if (filterPixStatus === 'without_pix') {
      filtered = filtered.filter(c => !c.pix_key);
    }

    setFilteredCommissions(filtered);
  };

  const loadCommissionDetails = async (userId: string) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/financial/commission-payments/user/${userId}/details`);
      const data = (response.data.data || []).map((item: any) => ({
        ...item,
        sale_value: parseFloat(item.sale_value) || 0,
        commission_percentage: parseFloat(item.commission_percentage) || 0,
        commission_amount: parseFloat(item.commission_amount) || 0,
      }));
      setCommissionDetails(data);
      
      // Carregar dados bancários do usuário
      const userResponse = await api.get(`/users/${userId}`);
      setUserBankData(userResponse.data.user);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes das comissões');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectUser = async (user: PendingCommission) => {
    setSelectedUser(user);
    setSelectedCommissions([]);
    setPaymentData(null);
    await loadCommissionDetails(user.user_id);
    setShowDetailsModal(true);
  };

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions(prev => 
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const selectAllCommissions = () => {
    if (selectedCommissions.length === commissionDetails.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(commissionDetails.map(c => c.id));
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedUser) return;
    
    if (selectedCommissions.length === 0) {
      toast.error('Selecione ao menos uma comissão para pagar');
      return;
    }

    if (!selectedUser.pix_key) {
      toast.error('Usuário não possui chave PIX cadastrada');
      return;
    }

    try {
      setProcessing(true);

      const selectedDetails = commissionDetails.filter(c => selectedCommissions.includes(c.id));
      const totalAmount = selectedDetails.reduce((sum, c) => sum + c.commission_amount, 0);

      const response = await api.post('/financial/commission-payments/create', {
        userId: selectedUser.user_id,
        paymentMethod: 'pix',
        commissionIds: selectedCommissions,
        notes: `Pagamento de ${selectedCommissions.length} comissão(ões)`
      });

      if (response.data.success) {
        const { paymentId, qrCode } = response.data.data;
        
        // Criar dados do pagamento para exibição
        setPaymentData({
          payment_id: paymentId,
          user_name: selectedUser.user_name,
          amount: totalAmount,
          pix_key: selectedUser.pix_key!,
          pix_type: selectedUser.pix_type!,
          qr_code: qrCode?.qrCodeBase64 || '',
          created_at: new Date().toISOString(),
          commission_ids: selectedCommissions
        });
        
        setShowPaymentModal(true);
        toast.success('Pagamento criado com sucesso!');
        await loadPendingCommissions();
      }
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData) return;

    try {
      setProcessing(true);
      
      const transactionId = `PIX-${Date.now()}`;
      await api.put(`/financial/commission-payments/${paymentData.payment_id}/confirm`, {
        transactionId,
        metadata: { confirmed_at: new Date().toISOString() }
      });

      toast.success('Pagamento confirmado com sucesso!');
      setShowPaymentModal(false);
      setShowDetailsModal(false);
      setPaymentData(null);
      setSelectedUser(null);
      await loadPendingCommissions();
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPixType = (type: string | null) => {
    const types: any = {
      'cpf': 'CPF',
      'cnpj': 'CNPJ',
      'email': 'E-mail',
      'telefone': 'Telefone',
      'chave_aleatoria': 'Chave Aleatória'
    };
    return types[type || ''] || 'Não informado';
  };

  const totalPending = filteredCommissions.reduce((sum, c) => sum + c.total_amount, 0);
  const totalUsers = filteredCommissions.length;
  const usersWithPix = filteredCommissions.filter(c => c.pix_key).length;
  const usersWithoutPix = filteredCommissions.filter(c => !c.pix_key).length;

  const selectedTotal = commissionDetails
    .filter(c => selectedCommissions.includes(c.id))
    .reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Banknote className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Pagamentos via PIX
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Processe pagamentos de comissões aprovadas
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <History className="w-5 h-5" />
              Histórico
            </button>
          </div>

          {/* Alerta Informativo */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Sobre esta aba:</p>
              <p>Aqui aparecem apenas <strong>vendas já aprovadas pelo financeiro</strong> com comissões pendentes de pagamento. Vendas ainda não aprovadas não serão exibidas.</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pendente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {totalPending.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Consultores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalUsers}
                </p>
              </div>
              <User className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Com PIX</p>
                <p className="text-2xl font-bold text-green-600">
                  {usersWithPix}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sem PIX</p>
                <p className="text-2xl font-bold text-red-600">
                  {usersWithoutPix}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterPixStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterPixStatus === 'all'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterPixStatus('with_pix')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterPixStatus === 'with_pix'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Com PIX
              </button>
              <button
                onClick={() => setFilterPixStatus('without_pix')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterPixStatus === 'without_pix'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Sem PIX
              </button>
            </div>
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando comissões...</p>
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma comissão pendente
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Não há comissões aprovadas aguardando pagamento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommissions.map((user) => (
              <div
                key={user.user_id}
                onClick={() => handleSelectUser(user)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-500 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-500 transition-colors">
                        {user.user_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.user_email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      R$ {user.total_amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Comissões:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.commissions_count}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pessoal:</span>
                    <span className="text-blue-600 font-medium">
                      R$ {user.total_personal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Rede:</span>
                    <span className="text-purple-600 font-medium">
                      R$ {user.total_network.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {user.pix_key ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">PIX Cadastrado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">PIX Não Cadastrado</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalhes das Comissões */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full my-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Detalhes das Comissões</h2>
                    <p className="text-green-100">{selectedUser.user_name}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6 space-y-6">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <>
                    {/* Dados Bancários */}
                    {userBankData && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          Dados Bancários e PIX
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Nome</p>
                            <p className="font-medium text-gray-900 dark:text-white">{userBankData.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">E-mail</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{userBankData.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tipo PIX</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userBankData.pix_type ? formatPixType(userBankData.pix_type) : 'Não cadastrado'}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chave PIX</p>
                            {userBankData.pix_key ? (
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded-lg flex-1 text-gray-900 dark:text-white">
                                  {userBankData.pix_key}
                                </p>
                                <button
                                  onClick={() => copyToClipboard(userBankData.pix_key!)}
                                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                >
                                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">Chave PIX não cadastrada</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista de Comissões */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-500" />
                          Comissões Pendentes ({commissionDetails.length})
                        </h3>
                        <button
                          onClick={selectAllCommissions}
                          className="text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          {selectedCommissions.length === commissionDetails.length ? 'Desmarcar' : 'Selecionar'} Todas
                        </button>
                      </div>

                      <div className="space-y-3">
                        {commissionDetails.map((comm) => (
                          <div
                            key={comm.id}
                            onClick={() => toggleCommissionSelection(comm.id)}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              selectedCommissions.includes(comm.id)
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={selectedCommissions.includes(comm.id)}
                                readOnly
                                className="mt-1 w-5 h-5 text-green-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                  <div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      comm.type === 'personal'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30'
                                    }`}>
                                      {comm.type === 'personal' ? 'Pessoal' : 'Rede'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-bold text-green-600">
                                      R$ {comm.commission_amount.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {comm.commission_percentage}% de R$ {comm.sale_value.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">{comm.client_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Venda #{comm.sale_id.substring(0, 8)} • {new Date(comm.sale_date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Selecionado */}
                    {selectedCommissions.length > 0 && (
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-green-100 mb-1">Total Selecionado</p>
                            <p className="text-3xl font-bold">R$ {selectedTotal.toFixed(2)}</p>
                            <p className="text-sm text-green-100 mt-1">
                              {selectedCommissions.length} comissão(ões)
                            </p>
                          </div>
                          <DollarSign className="w-16 h-16 text-white/30" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={processing || selectedCommissions.length === 0 || !selectedUser.pix_key}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        Processar Pagamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Pagamento */}
        {showPaymentModal && paymentData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Pagamento Criado!</h2>
                    <p className="text-green-100">Realize o pagamento via PIX</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Info do Pagamento */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informações</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ID</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {paymentData.payment_id.substring(0, 13)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data/Hora</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(paymentData.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Beneficiário</p>
                      <p className="font-medium text-gray-900 dark:text-white">{paymentData.user_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tipo PIX</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatPixType(paymentData.pix_type)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chave PIX</p>
                    <div className="flex gap-2">
                      <p className="font-mono text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded-lg flex-1">
                        {paymentData.pix_key}
                      </p>
                      <button
                        onClick={() => copyToClipboard(paymentData.pix_key)}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Valor */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
                  <p className="text-green-100 mb-2">Valor Total</p>
                  <p className="text-5xl font-bold mb-2">R$ {paymentData.amount.toFixed(2)}</p>
                  <p className="text-green-100">{paymentData.commission_ids.length} comissão(ões)</p>
                </div>

                {/* QR Code PIX */}
                {paymentData.qr_code && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-500">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">QR Code PIX</h3>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-4 rounded-xl shadow-lg">
                        <img 
                          src={paymentData.qr_code} 
                          alt="QR Code PIX" 
                          className="w-64 h-64"
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        📱 Aponte a câmera do seu celular para pagar
                      </p>
                    </div>
                  </div>
                )}

                {/* Instruções */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Instruções:</h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Copie a chave PIX acima</li>
                    <li>Abra o app do seu banco</li>
                    <li>Escolha PIX e cole a chave</li>
                    <li>Confirme o valor e beneficiário</li>
                    <li>Realize o pagamento</li>
                    <li>Clique em "Confirmar" abaixo</li>
                  </ol>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Pagamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Histórico */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Histórico de Pagamentos</h2>
                    <p className="text-gray-300">Pagamentos realizados</p>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                  Em breve você poderá visualizar o histórico completo de pagamentos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
