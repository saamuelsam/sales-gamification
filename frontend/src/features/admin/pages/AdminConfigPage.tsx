import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import api  from '@/services/api';
import { 
  RefreshCw, 
  Save, 
  Settings2, 
  Target,
  DollarSign,
  Award,
  Users,
  Zap,
  Bell,
  Mail,
  Database,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Gift
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Level {
  id: string;
  name: string;
  phase_number: number;
  points_required: number;
  personal_commission: number;
  insurance_commission: number;
  network_commission: number | null;
  fixed_allowance: number | null;
  advancement_bonus: number | null;
}

interface SystemConfig {
  // Pontos e Recompensas
  points_per_kilowatt: number;
  basket_reward_threshold: number;
  basket_reward_enabled: boolean;
  
  // Metas
  goal_monthly_revenue: number;
  goal_quarterly_revenue: number;
  goal_annual_revenue: number;
  
  // Comissões de Rede
  network_commission_line_1: number;
  network_commission_line_2: number;
  network_commission_line_3: number;
  
  // Notificações
  notifications_enabled: boolean;
  email_notifications: boolean;
  notification_sale_approved: boolean;
  notification_level_up: boolean;
  notification_reward_earned: boolean;
  
  // Sistema
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  max_team_size: number;
}

export function AdminConfigPage() {
  const [config, setConfig] = useState<SystemConfig>({
    points_per_kilowatt: 1,
    basket_reward_threshold: 400,
    basket_reward_enabled: true,
    goal_monthly_revenue: 100000,
    goal_quarterly_revenue: 300000,
    goal_annual_revenue: 1200000,
    network_commission_line_1: 2,
    network_commission_line_2: 1.5,
    network_commission_line_3: 1,
    notifications_enabled: true,
    email_notifications: true,
    notification_sale_approved: true,
    notification_level_up: true,
    notification_reward_earned: true,
    maintenance_mode: false,
    allow_new_registrations: true,
    max_team_size: 100,
  });
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'levels' | 'commissions' | 'notifications' | 'system'>('general');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [configRes, levelsRes] = await Promise.all([
        api.get('/admin/config'),
        api.get('/levels')
      ]);
      
      if (configRes.data?.data) {
        setConfig(prev => ({ ...prev, ...configRes.data.data }));
      }
      
      if (levelsRes.data?.data) {
        setLevels(levelsRes.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/config', config);
      toast.success('✅ Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLevelUpdate = async (levelId: string, updates: Partial<Level>) => {
    try {
      await api.patch(`/levels/${levelId}`, updates);
      toast.success('✅ Nível atualizado com sucesso!');
      fetchConfig();
    } catch (error) {
      toast.error('Erro ao atualizar nível');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <p className="text-center mt-10 text-gray-500 dark:text-gray-400">
          Carregando configurações...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ⚙️ Configurações do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Gerencie parâmetros, níveis e configurações globais
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Target className="w-4 h-4" />
            Geral
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'levels'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Award className="w-4 h-4" />
            Níveis
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'commissions'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Comissões
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notificações
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'system'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Sistema
          </button>
        </div>
      </Card>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Pontos e Recompensas */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Pontos e Recompensas
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pontos por kW
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.points_per_kilowatt}
                  onChange={(e) =>
                    setConfig({ ...config, points_per_kilowatt: Number(e.target.value) })
                  }
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pontos ganhos por quilowatt vendido
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta para Cesta Básica (kW)
                </label>
                <input
                  type="number"
                  value={config.basket_reward_threshold}
                  onChange={(e) =>
                    setConfig({ ...config, basket_reward_threshold: Number(e.target.value) })
                  }
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  kW necessários para ganhar cesta básica
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cesta Básica Ativa
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    onClick={() => setConfig({ ...config, basket_reward_enabled: !config.basket_reward_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.basket_reward_enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.basket_reward_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {config.basket_reward_enabled ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ativar/desativar recompensa automática
                </p>
              </div>
            </div>
          </Card>

          {/* Metas de Faturamento */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Metas de Faturamento
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Mensal (R$)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={config.goal_monthly_revenue}
                  onChange={(e) =>
                    setConfig({ ...config, goal_monthly_revenue: Number(e.target.value) })
                  }
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Trimestral (R$)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={config.goal_quarterly_revenue}
                  onChange={(e) =>
                    setConfig({ ...config, goal_quarterly_revenue: Number(e.target.value) })
                  }
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Anual (R$)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={config.goal_annual_revenue}
                  onChange={(e) =>
                    setConfig({ ...config, goal_annual_revenue: Number(e.target.value) })
                  }
                  className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Gerenciar Níveis de Carreira
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Nível
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Pontos
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Comissão
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Seguro
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Rede
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Ajuda Custo
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Bônus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {levels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {level.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {level.points_required.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {level.personal_commission}%
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {level.insurance_commission}%
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {level.network_commission ? `${level.network_commission}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {level.fixed_allowance ? `R$ ${level.fixed_allowance.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {level.advancement_bonus ? `R$ ${level.advancement_bonus.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Informação
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Os níveis são gerenciados através do banco de dados. Para editar valores, use a API /levels/:id ou atualize diretamente no banco.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Comissões de Rede
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                1ª Linha (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.network_commission_line_1}
                onChange={(e) =>
                  setConfig({ ...config, network_commission_line_1: Number(e.target.value) })
                }
                className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Comissão sobre vendas diretas da equipe
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                2ª Linha (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.network_commission_line_2}
                onChange={(e) =>
                  setConfig({ ...config, network_commission_line_2: Number(e.target.value) })
                }
                className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Comissão sobre vendas da 2ª linha
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3ª Linha (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.network_commission_line_3}
                onChange={(e) =>
                  setConfig({ ...config, network_commission_line_3: Number(e.target.value) })
                }
                className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Comissão sobre vendas da 3ª linha
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Atenção
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Mudanças nas comissões afetarão apenas novas vendas. Comissões já calculadas não serão alteradas.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Configurações de Notificações
            </h2>
          </div>

          <div className="space-y-4">
            {/* Sistema de Notificações */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Sistema de Notificações
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ativar/desativar todas as notificações
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, notifications_enabled: !config.notifications_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.notifications_enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notificações por Email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enviar emails para eventos importantes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, email_notifications: !config.email_notifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.email_notifications ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Venda Aprovada */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Venda Aprovada
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notificar quando uma venda for aprovada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, notification_sale_approved: !config.notification_sale_approved })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.notification_sale_approved ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.notification_sale_approved ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Promoção de Nível */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Promoção de Nível
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notificar quando usuário subir de nível
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, notification_level_up: !config.notification_level_up })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.notification_level_up ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.notification_level_up ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Recompensa Conquistada */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Recompensa Conquistada
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notificar quando ganhar recompensas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, notification_reward_earned: !config.notification_reward_earned })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.notification_reward_earned ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.notification_reward_earned ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Controles do Sistema
              </h2>
            </div>

            <div className="space-y-4">
              {/* Modo Manutenção */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Modo Manutenção
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Desabilitar acesso ao sistema temporariamente
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, maintenance_mode: !config.maintenance_mode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.maintenance_mode ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Novos Registros */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Permitir Novos Registros
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Habilitar cadastro de novos usuários
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, allow_new_registrations: !config.allow_new_registrations })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.allow_new_registrations ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.allow_new_registrations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Tamanho Máximo da Equipe */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tamanho Máximo da Equipe
                </label>
                <input
                  type="number"
                  value={config.max_team_size}
                  onChange={(e) =>
                    setConfig({ ...config, max_team_size: Number(e.target.value) })
                  }
                  className="mt-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Limite de membros por equipe/líder
                </p>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-100">
                Zona de Perigo
              </h2>
            </div>

            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              As ações abaixo são irreversíveis e podem afetar todo o sistema. Use com extrema cautela.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja limpar todas as notificações? Esta ação não pode ser desfeita.')) {
                    toast.success('Funcionalidade em desenvolvimento');
                  }
                }}
                className="px-4 py-2 text-sm border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Limpar Notificações
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja recalcular todas as comissões? Esta ação pode levar alguns minutos.')) {
                    toast.success('Funcionalidade em desenvolvimento');
                  }
                }}
                className="px-4 py-2 text-sm border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Recalcular Comissões
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja resetar todos os pontos? ESTA AÇÃO NÃO PODE SER DESFEITA!')) {
                    toast.error('Funcionalidade desabilitada por segurança');
                  }
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Resetar Pontos (Perigoso)
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}