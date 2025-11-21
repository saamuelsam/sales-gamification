// frontend/src/pages/SalesPage.tsx

import { useState, useEffect } from 'react';
import { Plus, X, Eye, Trash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useInvalidateDashboard } from '@/features/dashboard/hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';
import { getAvailableStatusOptions, allStatusOptions } from '../utils/statusPermissions';
import { SaleFormModal } from '../components/SaleFormModal';

type SaleStatus = 'negotiation' | 'pending' | 'approved' | 'financing_denied' | 'cancelled' | 'delivered';
type SaleType = 'direct' | 'consortium' | 'cash' | 'card';

interface Sale {
  id: string;
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  sale_type?: SaleType;
  consortium_value?: number;
  consortium_term?: number;
  consortium_monthly_payment?: number;
  consortium_admin_fee?: number;
  status: SaleStatus;
  created_at: string;
  notes?: string;
  points?: number;
  cpf?: string;
  phone?: string;
  email?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  cep?: string;
  client_full_name?: string;
  neighborhood?: string;
}

// Criar statusConfig a partir dos status disponíveis
const statusConfig: Record<SaleStatus, { label: string; color: string }> = allStatusOptions.reduce((acc, option) => {
  acc[option.value] = { label: option.label, color: option.color };
  return acc;
}, {} as Record<SaleStatus, { label: string; color: string }>);

export const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | SaleStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState<Sale | null>(null);

  const invalidateDashboard = useInvalidateDashboard();

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
    } catch {
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
    } catch {
      toast.error('Erro ao carregar detalhes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta venda?')) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Venda excluída');
      invalidateDashboard();
      fetchSales();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchSearch = (sale.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-accent/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-2 sm:p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-primary-400">Vendas</h1>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-highlight text-neutral px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Carregando...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">Nenhuma venda encontrada</p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-primary truncate">
                      {sale.client_name}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          sale.sale_type === 'consortium'
                            ? 'bg-highlight/10 text-highlight border-highlight/30'
                            : sale.sale_type === 'cash'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : sale.sale_type === 'card'
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : 'bg-primary/10 text-primary border-primary/30'
                        }`}
                      >
                        {sale.sale_type === 'consortium'
                          ? '🏦 Consórcio'
                          : sale.sale_type === 'cash'
                          ? '💵 À Vista'
                          : sale.sale_type === 'card'
                          ? '💳 Cartão'
                          : '💳 Financ.'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      statusConfig[sale.status]?.color
                    }`}
                  >
                    {statusConfig[sale.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Valor</p>
                    <p className="font-semibold text-primary dark:text-primary-400">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(sale.value)}
                    </p>
                  </div>

                  {sale.sale_type === 'consortium' && sale.consortium_value ? (
                    <div>
                      <p className="text-highlight">Consórcio</p>
                      <p className="font-semibold text-highlight">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(sale.consortium_value)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Potência</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{sale.kilowatts} kW</p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Data</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>

                  {sale.sale_type === 'consortium' && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Potência</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{sale.kilowatts} kW</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-1 pt-2 border-t dark:border-gray-700">
                  <button
                    onClick={() => handleViewDetails(sale)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-primary-400 rounded text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded transition-colors"
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
        <SaleFormModal
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
          onUpdate={fetchSales}
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
  const [saleType, setSaleType] = useState<SaleType>('direct');
  const [loading, setLoading] = useState(false);

  const invalidateDashboard = useInvalidateDashboard();

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
      e.preventDefault();    setLoading(true);
    try {
      // Enviar venda diretamente com o nome do cliente
      const payload: any = {
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
      } else if (saleData.insurance_value) {
        payload.insurance_value = parseFloat(saleData.insurance_value);
      }

      const response = await api.post('/sales', payload);
      
      toast.success('Venda cadastrada!');
      invalidateDashboard();
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao cadastrar venda:', error);
      toast.error(error.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh', height: 'auto' }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl shrink-0">
          <h2 className="text-base font-bold text-primary dark:text-primary-400">
            {step === 'client' ? '👤 Dados do Cliente' : '📊 Dados da Venda'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <div className="flex gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 shrink-0">
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'client' ? 'bg-primary' : 'bg-accent'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'sale' ? 'bg-primary' : 'bg-gray-300'}`} />
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(90vh - 140px)' }}
        >
          {step === 'client' ? (
            <form onSubmit={handleNext} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo *</label>
                <input
                  type="text"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
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
                  className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
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
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={clientData.city}
                    onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
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
                  className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
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
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Estado</label>
                  <input
                    type="text"
                    value={clientData.state}
                    onChange={(e) => setClientData({ ...clientData, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="h-4"></div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
                <p className="text-xs text-primary font-medium mb-0.5">Cliente Selecionado</p>
                <p className="font-bold text-sm text-primary">{clientData.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Venda *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaleType('direct')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${
                      saleType === 'direct' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    💳 Financiamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType('consortium')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${
                      saleType === 'consortium' ? 'border-highlight bg-highlight/10 text-highlight' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    🏦 Consórcio
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType('cash')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${
                      saleType === 'cash' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    💵 À Vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType('card')}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all ${
                      saleType === 'card' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-700'
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-highlight text-base"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-highlight text-base"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-highlight text-base"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  {saleData.consortium_value && (
                    <div className="bg-highlight/10 border border-highlight/30 rounded-lg p-4">
                      <p className="text-sm text-highlight">
                        <strong>Comissão prevista:</strong>{' '}
                        R{' '}
                        {(parseFloat(saleData.consortium_value) * 0.05).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        (5%)
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-base"
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
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea
                  value={saleData.notes}
                  onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>

              <div className="h-4"></div>
            </form>
          )}
        </div>

        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shrink-0 rounded-b-2xl">
          <div className="flex gap-2">
            {step === 'sale' && (
              <button
                type="button"
                onClick={() => setStep('client')}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
              >
                ← Voltar
              </button>
            )}

            {step === 'client' ? (
              <button
                type="submit"
                onClick={handleNext}
                className="flex-1 px-4 py-3 bg-primary hover:bg-highlight text-white rounded-lg font-medium text-sm shadow-lg transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary hover:bg-highlight text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-colors"
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
  sale: Sale;
  onClose: () => void;
  onUpdate: () => void;
}

const SaleDetailsModal = ({ sale, onClose, onUpdate }: SaleDetailsModalProps) => {
  const invalidateDashboard = useInvalidateDashboard();
  const { user } = useAuthStore();
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClientName, setEditingClientName] = useState(sale.client_name);
  const [savingClient, setSavingClient] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleUpdateClient = async () => {
    if (!editingClientName || editingClientName.trim().length === 0) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    try {
      setSavingClient(true);
      await api.put(`/sales/${sale.id}/client`, {
        client_name: editingClientName.trim()
      });
      toast.success('Cliente atualizado com sucesso!');
      setShowEditClientModal(false);
      onUpdate();
      invalidateDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Por favor, selecione um status');
      return;
    }

    try {
      setUpdatingStatus(true);
      await api.put(`/sales/${sale.id}/status`, { status: newStatus });
      toast.success('Status atualizado com sucesso');
      setShowStatusModal(false);
      setNewStatus('');
      onUpdate();
      invalidateDashboard();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar status';
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl shrink-0">
          <h2 className="text-base font-bold text-primary dark:text-primary-400">Detalhes da Venda</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold">Status da Venda</p>
              <button
                onClick={() => {
                  setNewStatus(sale.status);
                  setShowStatusModal(true);
                }}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Alterar Status
              </button>
            </div>

            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${
                statusConfig[sale.status]?.color || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusConfig[sale.status]?.label || sale.status}
            </span>
          </div>

          {sale.sale_type && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2.5">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1.5">Tipo de Venda</p>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                  sale.sale_type === 'consortium'
                    ? 'bg-highlight/10 text-highlight border-highlight/30'
                    : sale.sale_type === 'cash'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : sale.sale_type === 'card'
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-primary/10 text-primary border-primary/30'
                }`}
              >
                {sale.sale_type === 'consortium'
                  ? '🏦 Consórcio'
                  : sale.sale_type === 'cash'
                  ? '💵 À Vista'
                  : sale.sale_type === 'card'
                  ? '💳 Cartão'
                  : '💳 Financiamento'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs text-primary mb-1">Valor Total</p>
              <p className="text-lg font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
              </p>
            </div>

            {sale.sale_type === 'consortium' && sale.consortium_value && (
              <div className="bg-highlight/10 rounded-lg p-3 border border-highlight/20">
                <p className="text-xs text-highlight mb-1">Consórcio</p>
                <p className="text-lg font-bold text-highlight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.consortium_value)}
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs text-gray-600 mb-1">Potência</p>
              <p className="text-base font-semibold">{sale.kilowatts} kW</p>
            </div>

            {typeof sale.points === 'number' && (
              <div className="bg-accent/10 rounded-lg p-3 border border-accent/30">
                <p className="text-xs text-accent mb-1">Pontos</p>
                <p className="text-base font-semibold text-accent">{sale.points} pts</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-primary dark:text-primary-400">Informações do Cliente</h3>
              <button
                onClick={() => setShowEditClientModal(true)}
                className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
              >
                ✏️ Editar Cliente
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2.5">
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-0.5">Nome</p>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{sale.client_full_name || sale.client_name || '-'}</p>
              </div>
              {sale.cpf && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2.5">
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-0.5">CPF</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{sale.cpf}</p>
                </div>
              )}
              {sale.phone && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2.5">
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-0.5">Telefone</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{sale.phone}</p>
                </div>
              )}
              {sale.email && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2.5">
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-0.5">Email</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 break-all">{sale.email}</p>
                </div>
              )}
            </div>
          </div>

          {sale.street && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-1.5 text-primary">Endereço</h3>
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
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/30">
              <h3 className="text-sm font-semibold mb-1.5 text-accent">Observações</h3>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{sale.notes}</p>
            </div>
          )}

          <div className="h-4"></div>
        </div>

        {/* Modal de Editar Cliente */}
        {showEditClientModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl" style={{ zIndex: 10000 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                ✏️ Editar Nome do Cliente
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={editingClientName}
                  onChange={(e) => setEditingClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Digite o nome do cliente"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateClient}
                  disabled={savingClient}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingClient ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setShowEditClientModal(false);
                    setEditingClientName(sale.client_name);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Alterar Status */}
        {showStatusModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl" style={{ zIndex: 10000 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                🔄 Alterar Status da Venda
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Venda de <strong>{sale.client_name}</strong> no valor de{' '}
                <strong>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                </strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Novo Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableStatusOptions(user?.role).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
                {user?.role && !['ceo', 'admin', 'financeiro'].includes(user.role) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Consultores não podem aprovar vendas. Apenas Financeiro, CEO e Admin.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingStatus ? 'Atualizando...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus('');
                  }}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t bg-white shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="w-full bg-primary hover:bg-highlight text-white py-3 rounded-lg font-medium transition-colors shadow-md">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
