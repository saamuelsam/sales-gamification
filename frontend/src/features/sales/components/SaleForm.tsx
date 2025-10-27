// src/features/sales/components/SaleForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface SaleFormProps {
  onSuccess?: () => void;
}

export const SaleForm = ({ onSuccess }: SaleFormProps) => {
  const [formData, setFormData] = useState({
    client_name: '',
    value: '',
    kilowatts: '',
    insurance_value: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/sales', {
        ...formData,
        value: parseFloat(formData.value),
        kilowatts: parseFloat(formData.kilowatts),
        insurance_value: formData.insurance_value ? parseFloat(formData.insurance_value) : null,
      });
      toast.success('Venda cadastrada com sucesso!');
      setFormData({
        client_name: '',
        value: '',
        kilowatts: '',
        insurance_value: '',
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
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="pending">Pendente</option>
            <option value="closed">Fechada</option>
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Venda'}
        </Button>
      </form>
    </Card>
  );
};
