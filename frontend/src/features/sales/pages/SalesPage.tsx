import { useState, useEffect } from 'react';
import { Plus, X, Eye, Trash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface Sale {
  id: string;
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  sale_type?: string;
  consortium_value?: number;
  consortium_term?: number;
  consortium_monthly_payment?: number;
  consortium_admin_fee?: number;
  status: string;
  created_at: string;
  notes?: string;
}

const statusConfig = {
  negotiation: { label: 'Negociação', color: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  financing_denied: { label: 'Negado', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
  delivered: { label: 'Entregue', color: 'bg-purple-100 text-purple-800' },
};

export const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState<any>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    if (showCreateModal || showDetailsModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showCreateModal, showDetailsModal]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/sales');
      setSales(data.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (sale: Sale) => {
    try {
      const { data } = await api.get(`/sales/${sale.id}/with-client`);
      setSaleDetails(data.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error('Erro ao carregar detalhes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta venda?')) return;

    try {
      await api.delete(`/sales/${id}`);
      toast.success('Venda excluída');
      fetchSales();
    } catch (error: any) {
      toast.error('Erro ao excluir');
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchSearch = sale.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vendas</h1>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="all">Todos Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Carregando...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-sm text-gray-600">Nenhuma venda encontrada</p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-lg shadow-sm border p-3">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {sale.client_name}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sale.sale_type === 'consortium' ? 'bg-purple-100 text-purple-800' :
                          sale.sale_type === 'cash' ? 'bg-green-100 text-green-800' :
                            sale.sale_type === 'card' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                        }`}>
                        {sale.sale_type === 'consortium' ? '🏦 Consórcio' :
                          sale.sale_type === 'cash' ? '💵 À Vista' :
                            sale.sale_type === 'card' ? '💳 Cartão' :
                              '💳 Financ.'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[sale.status as keyof typeof statusConfig]?.color
                    }`}>
                    {statusConfig[sale.status as keyof typeof statusConfig]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <p className="text-gray-600">Valor</p>
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(sale.value)}
                    </p>
                  </div>

                  {sale.sale_type === 'consortium' && sale.consortium_value ? (
                    <div>
                      <p className="text-purple-600">Consórcio</p>
                      <p className="font-semibold text-purple-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(sale.consortium_value)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600">Potência</p>
                      <p className="font-semibold text-gray-900">{sale.kilowatts} kW</p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-600">Data</p>
                    <p className="text-gray-900">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </p>
                  </div>

                  {sale.sale_type === 'consortium' && (
                    <div>
                      <p className="text-gray-600">Potência</p>
                      <p className="font-semibold text-gray-900">{sale.kilowatts} kW</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-1 pt-2 border-t">
                  <button
                    onClick={() => handleViewDetails(sale)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateSaleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSales();
          }}
        />
      )}

      {showDetailsModal && saleDetails && (
        <SaleDetailsModal
          sale={saleDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSaleDetails(null);
          }}
        />
      )}
    </div>
  );
};

interface CreateSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSaleModal = ({ onClose, onSuccess }: CreateSaleModalProps) => {
  const [step, setStep] = useState<'client' | 'sale'>('client');
  const [saleType, setSaleType] = useState<'direct' | 'consortium' | 'cash' | 'card'>('direct');
  const [loading, setLoading] = useState(false);

  const [clientData, setClientData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    city: '',
    state: '',
  });

  const [saleData, setSaleData] = useState({
    value: '',
    kilowatts: '',
    insurance_value: '',
    consortium_value: '',
    consortium_term: '',
    consortium_monthly_payment: '',
    consortium_admin_fee: '',
    notes: '',
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('sale');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientResponse = await api.post('/clients', clientData);
      const clientId = clientResponse.data.data.id;

      const payload: any = {
        client_id: clientId,
        client_name: clientData.name,
        value: parseFloat(saleData.value),
        kilowatts: parseFloat(saleData.kilowatts),
        sale_type: saleType,
        notes: saleData.notes || undefined,
      };

      if (saleType === 'consortium') {
        payload.consortium_value = parseFloat(saleData.consortium_value);
        payload.consortium_term = parseInt(saleData.consortium_term);

        if (saleData.consortium_monthly_payment) {
          payload.consortium_monthly_payment = parseFloat(saleData.consortium_monthly_payment);
        }
        if (saleData.consortium_admin_fee) {
          payload.consortium_admin_fee = parseFloat(saleData.consortium_admin_fee);
        }
      } else {
        if (saleData.insurance_value) {
          payload.insurance_value = parseFloat(saleData.insurance_value);
        }
      }

      await api.post('/sales', payload);

      toast.success('Venda cadastrada!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl" style={{ maxHeight: '90vh', height: 'auto' }}>
        <div className="flex justify-between items-center px-4 py-3 border-b bg-white rounded-t-2xl shrink-0">
          <h2 className="text-base font-bold">
            {step === 'client' ? '👤 Dados do Cliente' : '📊 Dados da Venda'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 px-4 py-2 bg-gray-50 shrink-0">
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'client' ? 'bg-blue-600' : 'bg-green-600'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'sale' ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(90vh - 140px)' }}>
          {step === 'client' ? (
            <form onSubmit={handleNext} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome Completo *</label>
                <input
                  type="text"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="João Silva"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">CPF</label>
                  <input
                    type="text"
                    value={clientData.cpf}
                    onChange={(e) => setClientData({ ...clientData, cpf: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">CEP</label>
                  <input
                    type="text"
                    value={clientData.cep}
                    onChange={(e) => setClientData({ ...clientData, cep: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={clientData.city}
                    onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Rua</label>
                <input
                  type="text"
                  value={clientData.street}
                  onChange={(e) => setClientData({ ...clientData, street: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua Exemplo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Número</label>
                  <input
                    type="text"
                    value={clientData.number}
                    onChange={(e) => setClientData({ ...clientData, number: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Estado</label>
                  <input
                    type="text"
                    value={clientData.state}
                    onChange={(e) => setClientData({ ...clientData, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="h-4"></div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Cliente Selecionado</p>
                <p className="font-bold text-sm text-gray-900">{clientData.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Venda *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaleType('direct')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${saleType === 'direct' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'
                      }`}
                  >
                    💳 Financiamento
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaleType('consortium')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${saleType === 'consortium' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-700'
                      }`}
                  >
                    🏦 Consórcio
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaleType('cash')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${saleType === 'cash' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700'
                      }`}
                  >
                    💵 À Vista
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaleType('card')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${saleType === 'card' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-700'
                      }`}
                  >
                    💳 Cartão
                  </button>
                </div>
              </div>

              {saleType === 'consortium' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CurrencyInput
                      label="Valor do Sistema (R$) *"
                      value={saleData.value}
                      onValueChange={(val) => setSaleData({ ...saleData, value: val })}
                      placeholder="50.000,00"
                      required
                    />

                    <CurrencyInput
                      label="Valor do Consórcio (R$) *"
                      value={saleData.consortium_value}
                      onValueChange={(val) => setSaleData({ ...saleData, consortium_value: val })}
                      placeholder="80.000,00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Potência (kW) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={saleData.kilowatts}
                        onChange={(e) => setSaleData({ ...saleData, kilowatts: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base"
                        placeholder="10.5"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prazo (meses) *</label>
                      <input
                        type="number"
                        value={saleData.consortium_term}
                        onChange={(e) => setSaleData({ ...saleData, consortium_term: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base"
                        placeholder="84"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CurrencyInput
                      label="Parcela Mensal (R$)"
                      value={saleData.consortium_monthly_payment}
                      onValueChange={(val) => setSaleData({ ...saleData, consortium_monthly_payment: val })}
                      placeholder="1.200,00"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxa Admin (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={saleData.consortium_admin_fee}
                        onChange={(e) => setSaleData({ ...saleData, consortium_admin_fee: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  {saleData.consortium_value && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-800">
                        <strong>Comissão prevista:</strong> R$ {(parseFloat(saleData.consortium_value) * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (5%)
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <CurrencyInput
                    label="Valor da Venda (R$) *"
                    value={saleData.value}
                    onValueChange={(val) => setSaleData({ ...saleData, value: val })}
                    placeholder="50.000,00"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Potência (kW) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={saleData.kilowatts}
                      onChange={(e) => setSaleData({ ...saleData, kilowatts: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="10.5"
                      required
                    />
                  </div>

                  <CurrencyInput
                    label="Valor do Seguro (R$)"
                    value={saleData.insurance_value}
                    onValueChange={(val) => setSaleData({ ...saleData, insurance_value: val })}
                    placeholder="5.000,00"
                  />
                </>
              )}  {}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Observações</label>

                <textarea
                  value={saleData.notes}
                  onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>

              <div className="h-4"></div>
            </form>
          )}
        </div>

        <div className="px-4 py-3 bg-white border-t shrink-0 rounded-b-2xl">
          <div className="flex gap-2">
            {step === 'sale' && (
              <button
                type="button"
                onClick={() => setStep('client')}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                ← Voltar
              </button>
            )}

            {step === 'client' ? (
              <button
                type="submit"
                onClick={handleNext}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-lg transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </span>
                ) : (
                  '✓ Finalizar Cadastro'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SaleDetailsModalProps {
  sale: any;
  onClose: () => void;
}

const SaleDetailsModal = ({ sale, onClose }: SaleDetailsModalProps) => {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center px-4 py-3 border-b bg-white rounded-t-2xl shrink-0">
          <h2 className="text-base font-bold">Detalhes da Venda</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {sale.sale_type && (
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-600 mb-1.5">Tipo de Venda</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sale.sale_type === 'consortium' ? 'bg-purple-100 text-purple-800' :
                  sale.sale_type === 'cash' ? 'bg-green-100 text-green-800' :
                    sale.sale_type === 'card' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                }`}>
                {sale.sale_type === 'consortium' ? '🏦 Consórcio' :
                  sale.sale_type === 'cash' ? '💵 À Vista' :
                    sale.sale_type === 'card' ? '💳 Cartão' :
                      '💳 Financiamento'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Valor Total</p>
              <p className="text-lg font-bold text-blue-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
              </p>
            </div>

            {sale.sale_type === 'consortium' && sale.consortium_value && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-600 mb-1">Consórcio</p>
                <p className="text-lg font-bold text-purple-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.consortium_value)}
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-gray-600 mb-1">Potência</p>
              <p className="text-base font-semibold">{sale.kilowatts} kW</p>
            </div>

            {sale.points && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-600 mb-1">Pontos</p>
                <p className="text-base font-semibold text-green-700">{sale.points} pts</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2.5">
                <p className="text-xs text-gray-600 mb-0.5">Nome</p>
                <p className="text-xs font-medium">{sale.client_full_name || sale.client_name || '-'}</p>
              </div>
              {sale.cpf && (
                <div className="bg-gray-50 rounded p-2.5">
                  <p className="text-xs text-gray-600 mb-0.5">CPF</p>
                  <p className="text-xs font-medium">{sale.cpf}</p>
                </div>
              )}
              {sale.phone && (
                <div className="bg-gray-50 rounded p-2.5">
                  <p className="text-xs text-gray-600 mb-0.5">Telefone</p>
                  <p className="text-xs font-medium">{sale.phone}</p>
                </div>
              )}
              {sale.email && (
                <div className="bg-gray-50 rounded p-2.5">
                  <p className="text-xs text-gray-600 mb-0.5">Email</p>
                  <p className="text-xs font-medium break-all">{sale.email}</p>
                </div>
              )}
            </div>
          </div>

          {sale.street && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-1.5">Endereço</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {sale.street}, {sale.number || 'S/N'}
                {sale.neighborhood && ` - ${sale.neighborhood}`}
                <br />
                {sale.city}/{sale.state}
                {sale.cep && ` - CEP: ${sale.cep}`}
              </p>
            </div>
          )}

          {sale.notes && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <h3 className="text-sm font-semibold mb-1.5">Observações</h3>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{sale.notes}</p>
            </div>
          )}

          <div className="h-4"></div>
        </div>

        <div className="px-4 py-3 border-t bg-white shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
