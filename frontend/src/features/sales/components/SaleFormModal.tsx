// frontend/src/features/sales/components/SaleFormModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

type SaleType = 'direct' | 'consortium' | 'cash' | 'card';

interface SaleFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  consultantId?: string; // Se fornecido, cria venda para esse consultor (CEO mode)
  consultantName?: string;
}

export const SaleFormModal = ({ onClose, onSuccess, consultantId, consultantName }: SaleFormModalProps) => {
  const [step, setStep] = useState<'client' | 'sale'>('client');
  const [saleType, setSaleType] = useState<SaleType>('direct');
  const [loading, setLoading] = useState(false);

  const isCeoMode = !!consultantId;

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

      // ✅ CEO pode criar venda para qualquer consultor
      const endpoint = isCeoMode 
        ? `/ceo/consultants/${consultantId}/sales`
        : '/sales';

      await api.post(endpoint, payload);
      
      toast.success(isCeoMode 
        ? `Venda criada para ${consultantName}!`
        : 'Venda cadastrada!'
      );
      
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
          <div>
            <h2 className="text-base font-bold text-primary dark:text-primary-400">
              {step === 'client' ? '👤 Dados do Cliente' : '📊 Dados da Venda'}
            </h2>
            {isCeoMode && consultantName && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Criando venda para: <span className="font-semibold text-blue-600">{consultantName}</span>
              </p>
            )}
          </div>
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">CPF</label>
                  <input
                    type="text"
                    value={clientData.cpf}
                    onChange={(e) => setClientData({ ...clientData, cpf: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">CEP</label>
                  <input
                    type="text"
                    value={clientData.cep}
                    onChange={(e) => setClientData({ ...clientData, cep: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={clientData.city}
                    onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rua</label>
                <input
                  type="text"
                  value={clientData.street}
                  onChange={(e) => setClientData({ ...clientData, street: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Rua Exemplo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Número</label>
                  <input
                    type="text"
                    value={clientData.number}
                    onChange={(e) => setClientData({ ...clientData, number: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estado</label>
                  <input
                    type="text"
                    value={clientData.state}
                    onChange={(e) => setClientData({ ...clientData, state: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Tipo de Venda */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Venda *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'direct', label: '💳 Financ.', desc: 'Financiamento' },
                    { value: 'consortium', label: '🏦 Consórcio', desc: 'Pagamento parcelado' },
                    { value: 'cash', label: '💵 À Vista', desc: 'Pagamento único' },
                    { value: 'card', label: '💳 Cartão', desc: 'Cartão de crédito' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSaleType(type.value as SaleType)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        saleType === type.value
                          ? 'border-primary bg-primary/10 dark:bg-primary/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{type.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor e Potência */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Valor (R$) *</label>
                  <CurrencyInput
                    value={saleData.value}
                    onValueChange={(value: string) => setSaleData({ ...saleData, value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Potência (kW) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleData.kilowatts}
                    onChange={(e) => setSaleData({ ...saleData, kilowatts: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Campos específicos para Consórcio */}
              {saleType === 'consortium' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Valor Consórcio *</label>
                      <CurrencyInput
                        value={saleData.consortium_value}
                        onValueChange={(value: string) => setSaleData({ ...saleData, consortium_value: value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="R$ 0,00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prazo (meses) *</label>
                      <input
                        type="number"
                        value={saleData.consortium_term}
                        onChange={(e) => setSaleData({ ...saleData, consortium_term: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="60"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Parcela Mensal</label>
                      <CurrencyInput
                        value={saleData.consortium_monthly_payment}
                        onValueChange={(value: string) => setSaleData({ ...saleData, consortium_monthly_payment: value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Taxa Admin</label>
                      <CurrencyInput
                        value={saleData.consortium_admin_fee}
                        onValueChange={(value: string) => setSaleData({ ...saleData, consortium_admin_fee: value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Valor do Seguro (para não-consórcio) */}
              {saleType !== 'consortium' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Valor do Seguro (opcional)</label>
                  <CurrencyInput
                    value={saleData.insurance_value}
                    onValueChange={(value: string) => setSaleData({ ...saleData, insurance_value: value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="R$ 0,00"
                  />
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observações</label>
                <textarea
                  value={saleData.notes}
                  onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('client')}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Criar Venda'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
