import { useState, useEffect } from 'react';
import { Plus, Edit, Filter, X, Eye, Trash, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  status: string;
  created_at: string;
  notes?: string;
}

const statusConfig = {
  negotiation: { label: 'Negociação', color: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  financing_denied: { label: 'Financiamento Negado', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
  delivered: { label: 'Entregue', color: 'bg-purple-100 text-purple-800' },
};

export const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<any>(null);

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/sales');
      setSales(data.data);
    } catch (error) {
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filtrar vendas por status e termo de pesquisa
  const filteredSales = sales.filter((sale) => {
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    const matchesSearch = !searchTerm || 
      sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setShowEditModal(true);
  };

  const handleViewDetails = async (sale: Sale) => {
    try {
      const { data } = await api.get(`/sales/${sale.id}/client`);
      setSelectedSaleDetails(data.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
    }
  };

  // --- FUNÇÃO DELETE ADICIONADA ---
  const handleDelete = async (saleId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) {
      return;
    }
    try {
      await api.delete(`/sales/${saleId}`);
      toast.success('Venda excluída com sucesso!');
      fetchSales();
    } catch (error) {
      toast.error('Erro ao excluir venda');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Gerencie suas vendas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nova Venda
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="text-gray-400" size={20} />
            <h3 className="font-semibold text-gray-700">Filtrar por Status</h3>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="negotiation">Negociação</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="financing_denied">Financiamento Negado</option>
            <option value="cancelled">Cancelado</option>
            <option value="delivered">Entregue</option>
          </select>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Nenhuma venda encontrada</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {sale.client_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusConfig[sale.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusConfig[sale.status as keyof typeof statusConfig]?.label || sale.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Valor</p>
                  <p className="font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(sale.value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Potência</p>
                  <p className="font-bold text-gray-900">{sale.kilowatts} kW</p>
                </div>
              </div>

              {/* --- BOTÕES ATUALIZADOS --- */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleViewDetails(sale)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Ver Detalhes
                </Button>
                <Button
                  onClick={() => handleEdit(sale)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Status
                </Button>
                <Button
                  onClick={() => handleDelete(sale.id)}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 px-3"
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateSaleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchSales();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedSale && (
        <EditSaleModal
          sale={selectedSale}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSale(null);
          }}
          onSuccess={() => {
            fetchSales();
            setShowEditModal(false);
            setSelectedSale(null);
          }}
        />
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedSaleDetails && (
        <ViewDetailsModal
          saleDetails={selectedSaleDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSaleDetails(null);
          }}
          onUpdate={() => {
            fetchSales();
            setShowDetailsModal(false);
            setSelectedSaleDetails(null);
          }}
        />
      )}
    </div>
  );
};

// Modal de Criação
interface CreateSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSaleModal = ({ onClose, onSuccess }: CreateSaleModalProps) => {
  const [step, setStep] = useState<'client' | 'sale'>('client');
  const [clientData, setClientData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [saleData, setSaleData] = useState({
    value: '',
    kilowatts: '',
    insurance_value: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // --- MÉTODO handleSubmit (Atualizado) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'client') {
      setStep('sale');
      return;
    }
    setLoading(true);
    try {
      // 1. Criar cliente primeiro
      const clientResponse = await api.post('/clients', clientData);
      const clientId = clientResponse.data.data.id;
      // 2. Criar venda COM o client_id vinculado
      await api.post('/sales', {
        client_id: clientId, // ← Linha confirmada
        client_name: clientData.name,
        value: parseFloat(saleData.value),
        kilowatts: parseFloat(saleData.kilowatts),
        insurance_value: saleData.insurance_value ? parseFloat(saleData.insurance_value) : undefined,
        notes: saleData.notes || undefined,
      });
      toast.success('Venda cadastrada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar venda');
    } finally {
      setLoading(false);
    }
  };
  // --- FIM DO MÉTODO ---

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {step === 'client' ? 'Dados do Cliente' : 'Dados da Venda'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Indicador de progresso */}
        <div className="flex items-center mb-6">
          <div className={`flex-1 h-2 rounded-full ${step === 'client' ? 'bg-blue-600' : 'bg-green-600'}`} />
          <div className={`flex-1 h-2 rounded-full ml-2 ${step === 'sale' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'client' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="João da Silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={clientData.cpf}
                    onChange={(e) => setClientData({ ...clientData, cpf: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    value={clientData.cep}
                    onChange={(e) => setClientData({ ...clientData, cep: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rua</label>
                  <input
                    type="text"
                    value={clientData.street}
                    onChange={(e) => setClientData({ ...clientData, street: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rua Principal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                  <input
                    type="text"
                    value={clientData.number}
                    onChange={(e) => setClientData({ ...clientData, number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                  <input
                    type="text"
                    value={clientData.complement}
                    onChange={(e) => setClientData({ ...clientData, complement: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Apto 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                  <input
                    type="text"
                    value={clientData.neighborhood}
                    onChange={(e) => setClientData({ ...clientData, neighborhood: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Centro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={clientData.city}
                    onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <input
                    type="text"
                    value={clientData.state}
                    onChange={(e) => setClientData({ ...clientData, state: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{clientData.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Venda (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saleData.value}
                  onChange={(e) => setSaleData({ ...saleData, value: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potência (kW) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saleData.kilowatts}
                  onChange={(e) => setSaleData({ ...saleData, kilowatts: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Seguro (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={saleData.insurance_value}
                  onChange={(e) => setSaleData({ ...saleData, insurance_value: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={saleData.notes}
                  onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detalhes adicionais..."
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            {step === 'sale' && (
              <Button
                type="button"
                onClick={() => setStep('client')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Voltar
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Cadastrando...' : step === 'client' ? 'Próximo' : 'Finalizar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Edição
interface EditSaleModalProps {
  sale: Sale;
  onClose: () => void;
  onSuccess: () => void;
}

const EditSaleModal = ({ sale, onClose, onSuccess }: EditSaleModalProps) => {
  const [status, setStatus] = useState(sale.status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/sales/${sale.id}`, { status });
      toast.success('Venda atualizada com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Editar Venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">Cliente</p>
          <p className="font-semibold text-gray-900">{sale.client_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="negotiation">Negociação</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="financing_denied">Financiamento Negado</option>
              <option value="cancelled">Cancelado</option>
              <option value="delivered">Entregue</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Visualização e Edição Completa
interface ViewDetailsModalProps {
  saleDetails: any;
  onClose: () => void;
  onUpdate: () => void;
}

const ViewDetailsModal = ({ saleDetails, onClose, onUpdate }: ViewDetailsModalProps) => {
  const [editing, setEditing] = useState(false);
  const [clientData, setClientData] = useState({
    name: saleDetails.client_full_name || saleDetails.client_name || '',
    cpf: saleDetails.cpf || '',
    phone: saleDetails.phone || '',
    email: saleDetails.email || '',
    cep: saleDetails.cep || '',
    street: saleDetails.street || '',
    number: saleDetails.number || '',
    complement: saleDetails.complement || '',
    neighborhood: saleDetails.neighborhood || '',
    city: saleDetails.city || '',
    state: saleDetails.state || '',
  });
  const [saleData, setSaleData] = useState({
    status: saleDetails.status || 'negotiation',
    value: saleDetails.value || '',
    kilowatts: saleDetails.kilowatts || '',
    insurance_value: saleDetails.insurance_value || '',
    notes: saleDetails.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Atualizar cliente se houver client_id
      if (saleDetails.client_id) {
        await api.put(`/clients/${saleDetails.client_id}`, clientData);
      }

      // 2. Atualizar venda
      await api.put(`/sales/${saleDetails.id}`, saleData);

      toast.success('Dados atualizados com sucesso!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editing ? 'Editar Venda' : 'Detalhes da Venda'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Informações da Venda */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4 text-blue-900">Informações da Venda</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Valor Total</p>
              <p className="text-2xl font-bold text-blue-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saleDetails.value)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Potência</p>
              <p className="text-2xl font-bold text-blue-900">{saleDetails.kilowatts} kW</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Pontos Ganhos</p>
              <p className="text-2xl font-bold text-blue-900">{saleDetails.points || 0}</p>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-6">
            {/* Dados do Cliente - Editável */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={clientData.cpf}
                    onChange={(e) => setClientData({ ...clientData, cpf: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    value={clientData.cep}
                    onChange={(e) => setClientData({ ...clientData, cep: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rua</label>
                  <input
                    type="text"
                    value={clientData.street}
                    onChange={(e) => setClientData({ ...clientData, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                  <input
                    type="text"
                    value={clientData.number}
                    onChange={(e) => setClientData({ ...clientData, number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                  <input
                    type="text"
                    value={clientData.neighborhood}
                    onChange={(e) => setClientData({ ...clientData, neighborhood: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    value={clientData.city}
                    onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <input
                    type="text"
                    value={clientData.state}
                    onChange={(e) => setClientData({ ...clientData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Dados da Venda - Editável */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Dados da Venda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={saleData.status}
                    onChange={(e) => setSaleData({ ...saleData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="negotiation">Negociação</option>
                    <option value="pending">Pendente</option>
                    <option value="approved">Aprovado</option>
                    <option value="financing_denied">Financiamento Negado</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="delivered">Entregue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Seguro</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleData.insurance_value}
                    onChange={(e) => setSaleData({ ...saleData, insurance_value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <textarea
                    value={saleData.notes}
                    onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dados do Cliente - Visualização */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-semibold">{saleDetails.client_full_name || saleDetails.client_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPF</p>
                  <p className="font-semibold">{saleDetails.cpf || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-semibold">{saleDetails.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{saleDetails.email || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-semibold">
                    {saleDetails.street && `${saleDetails.street}, ${saleDetails.number || 'S/N'}`}
                    {saleDetails.complement && ` - ${saleDetails.complement}`}
                    {saleDetails.neighborhood && ` - ${saleDetails.neighborhood}`}
                    {saleDetails.city && ` - ${saleDetails.city}`}
                    {saleDetails.state && `/${saleDetails.state}`}
                    {saleDetails.cep && ` - CEP: ${saleDetails.cep}`}
                    {!saleDetails.street && '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status e Observações */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    statusConfig[saleDetails.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {statusConfig[saleDetails.status as keyof typeof statusConfig]?.label || saleDetails.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data de Criação</p>
                  <p className="font-semibold">{new Date(saleDetails.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {saleDetails.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="font-semibold">{saleDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Fechar
          </Button>
          {editing ? (
            <>
              <Button
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setEditing(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Editar Dados
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};