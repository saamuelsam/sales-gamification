// src/features/sales/components/SaleForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface SaleFormProps {
  onSuccess?: () => void;
}

type SaleType = 'direct' | 'consortium' | 'cash';

export const SaleForm = ({ onSuccess }: SaleFormProps) => {
  const [saleType, setSaleType] = useState<SaleType>('direct');
  const [formData, setFormData] = useState({
    client_name: '',
    value: '',
    kilowatts: '',
    insurance_value: '',
    consortium_value: '',
    consortium_term: '',
    consortium_monthly_payment: '',
    consortium_admin_fee: '',
    notes: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        client_name: formData.client_name,
        value: parseFloat(formData.value),
        kilowatts: parseFloat(formData.kilowatts),
        sale_type: saleType,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      // Adicionar campos específicos por tipo
      if (saleType === 'consortium') {
        payload.consortium_value = parseFloat(formData.consortium_value);
        payload.consortium_term = parseInt(formData.consortium_term);
        
        if (formData.consortium_monthly_payment) {
          payload.consortium_monthly_payment = parseFloat(formData.consortium_monthly_payment);
        }
        if (formData.consortium_admin_fee) {
          payload.consortium_admin_fee = parseFloat(formData.consortium_admin_fee);
        }
      } else {
        // Apenas vendas diretas/à vista podem ter seguro
        if (formData.insurance_value) {
          payload.insurance_value = parseFloat(formData.insurance_value);
        }
      }

      await api.post('/sales', payload);
      
      toast.success(
        saleType === 'consortium' 
          ? 'Consórcio cadastrado com sucesso!' 
          : 'Venda cadastrada com sucesso!'
      );
      
      // Limpar formulário
      setFormData({
        client_name: '',
        value: '',
        kilowatts: '',
        insurance_value: '',
        consortium_value: '',
        consortium_term: '',
        consortium_monthly_payment: '',
        consortium_admin_fee: '',
        notes: '',
        status: 'pending',
      });
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Nova Venda">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Venda */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Venda</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSaleType('direct')}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                saleType === 'direct'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              💳 Financiamento
            </button>
            
            <button
              type="button"
              onClick={() => setSaleType('consortium')}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                saleType === 'consortium'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              🏢 Consórcio
            </button>
            
            <button
              type="button"
              onClick={() => setSaleType('cash')}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                saleType === 'cash'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              💰 À Vista
            </button>
          </div>
        </div>

        {/* Nome do Cliente */}
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o nome completo"
            required
          />
        </div>

        {/* Campos Específicos por Tipo */}
        {saleType === 'consortium' ? (
          <>
            {/* CAMPOS DE CONSÓRCIO */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor do Sistema (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="50000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor do Consórcio (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.consortium_value}
                  onChange={(e) => setFormData({ ...formData, consortium_value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="80000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Potência (kW)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.kilowatts}
                  onChange={(e) => setFormData({ ...formData, kilowatts: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="10.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prazo (meses)</label>
                <input
                  type="number"
                  value={formData.consortium_term}
                  onChange={(e) => setFormData({ ...formData, consortium_term: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="84"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Parcela Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.consortium_monthly_payment}
                  onChange={(e) => setFormData({ ...formData, consortium_monthly_payment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="1200 (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Taxa Admin (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.consortium_admin_fee}
                  onChange={(e) => setFormData({ ...formData, consortium_admin_fee: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="15 (opcional)"
                />
              </div>
            </div>

            {/* Info de Comissão Consórcio */}
            {formData.consortium_value && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <strong>Comissão prevista:</strong> R$ {(parseFloat(formData.consortium_value) * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (5%)
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* CAMPOS DE VENDA NORMAL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kilowatts (kW)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.kilowatts}
                  onChange={(e) => setFormData({ ...formData, kilowatts: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Valor do Seguro (opcional)</label>
              <input
                type="number"
                step="0.01"
                value={formData.insurance_value}
                onChange={(e) => setFormData({ ...formData, insurance_value: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="2000"
              />
            </div>
          </>
        )}

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium mb-2">Observações</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Informações adicionais..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pendente</option>
            <option value="closed">Fechada</option>
          </select>
        </div>

        {/* Botão Submit */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Cadastrando...
            </span>
          ) : (
            saleType === 'consortium' ? 'Cadastrar Consórcio' : 'Cadastrar Venda'
          )}
        </Button>
      </form>
    </Card>
  );
};