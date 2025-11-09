import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import api  from '@/services/api';
import { RefreshCw, Save, Settings2, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface Config {
  commission_rate_consultant: number;
  commission_rate_master_consultant: number;
  commission_rate_executive: number;
  goal_monthly_revenue: number;
  points_per_sale: number;
}

export function AdminConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/config');
      setConfig(res.data?.data || {});
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.patch('/admin/config', config);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading || !config)
    return <p className="text-center mt-10 text-gray-500">Carregando configurações...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 text-sm">Gerencie taxas, metas e parâmetros globais</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> Salvar
          </button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Taxas de Comissão</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Consultor (%)</label>
            <input
              type="number"
              value={config.commission_rate_consultant || 0}
              onChange={(e) =>
                setConfig({ ...config, commission_rate_consultant: Number(e.target.value) })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Master Consultant (%)</label>
            <input
              type="number"
              value={config.commission_rate_master_consultant || 0}
              onChange={(e) =>
                setConfig({ ...config, commission_rate_master_consultant: Number(e.target.value) })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Executivo (%)</label>
            <input
              type="number"
              value={config.commission_rate_executive || 0}
              onChange={(e) =>
                setConfig({ ...config, commission_rate_executive: Number(e.target.value) })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Meta Mensal de Faturamento (R$)</label>
            <input
              type="number"
              value={config.goal_monthly_revenue || 0}
              onChange={(e) =>
                setConfig({ ...config, goal_monthly_revenue: Number(e.target.value) })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="border-t my-4" />

        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">Metas e Pontos</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">

          <div>
            <label className="text-sm font-medium text-gray-600">Pontos por Venda</label>
            <input
              type="number"
              value={config.points_per_sale || 0}
              onChange={(e) =>
                setConfig({ ...config, points_per_sale: Number(e.target.value) })
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
