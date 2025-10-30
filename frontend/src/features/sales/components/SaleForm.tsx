// src/features/sales/components/SaleForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { formatNumber, parseNumber } from '@/utils/formatters'; // ADICIONE ESTA LINHA

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
        {/* ... código do tipo de venda e nome do cliente ... */}
        
        {saleType === 'consortium' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor Sistema (R$) *</label>
                <input
                  type="text"
                  value={formatNumber(formData.value)}
                  onChange={(e) => setFormData({ ...formData, value: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="50.000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor Consórcio (R$) *</label>
                <input
                  type="text"
                  value={formatNumber(formData.consortium_value)}
                  onChange={(e) => setFormData({ ...formData, consortium_value: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="432.423"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Potência (kW) *</label>
                <input
                  type="text"
                  value={formatNumber(formData.kilowatts)}
                  onChange={(e) => setFormData({ ...formData, kilowatts: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="4.324"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prazo (meses) *</label>
                <input
                  type="text"
                  value={formatNumber(formData.consortium_term)}
                  onChange={(e) => setFormData({ ...formData, consortium_term: String(parseNumber(e.target.value)) })}
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
                  type="text"
                  value={formatNumber(formData.consortium_monthly_payment)}
                  onChange={(e) => setFormData({ ...formData, consortium_monthly_payment: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="1.200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Taxa Admin (R$)</label>
                <input
                  type="text"
                  value={formatNumber(formData.consortium_admin_fee)}
                  onChange={(e) => setFormData({ ...formData, consortium_admin_fee: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="4.234"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor (R$) *</label>
                <input
                  type="text"
                  value={formatNumber(formData.value)}
                  onChange={(e) => setFormData({ ...formData, value: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="50.000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kilowatts (kW) *</label>
                <input
                  type="text"
                  value={formatNumber(formData.kilowatts)}
                  onChange={(e) => setFormData({ ...formData, kilowatts: String(parseNumber(e.target.value)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Valor do Seguro (opcional)</label>
              <input
                type="text"
                value={formatNumber(formData.insurance_value)}
                onChange={(e) => setFormData({ ...formData, insurance_value: String(parseNumber(e.target.value)) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="2.000"
              />
            </div>
          </>
  

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
            saleType === 'consortium' ? '✓ Finalizar Cadastro' : 'Cadastrar Venda'
          )}
        </Button>
      </form>
    </Card>
  );
};