// frontend/src/features/admin/components/SystemSettings.tsx

import { useState, useEffect } from 'react';
import { Settings, ToggleLeft, ToggleRight, Save, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
  updated_by_name: string | null;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractsPerMonthEnabled, setContractsPerMonthEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      const allSettings = response.data.data;
      setSettings(allSettings);

      // Extrair valor de contracts_per_month_enabled
      const contractsSetting = allSettings.find(
        (s: Setting) => s.setting_key === 'contracts_per_month_enabled'
      );
      if (contractsSetting) {
        setContractsPerMonthEnabled(contractsSetting.setting_value === 'true');
      }
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const toggleContractsPerMonth = async () => {
    try {
      setIsSaving(true);
      const newValue = !contractsPerMonthEnabled;

      await api.post('/admin/settings/contracts-per-month/toggle', {
        enabled: newValue,
      });

      setContractsPerMonthEnabled(newValue);
      toast.success(
        `Contratos por mês ${newValue ? 'ativado' : 'desativado'} com sucesso!`,
        {
          icon: newValue ? '✅' : '⚠️',
          duration: 3000,
        }
      );

      // Recarregar configurações
      await fetchSettings();
    } catch (error: any) {
      console.error('Erro ao alternar contratos por mês:', error);
      toast.error('Erro ao alterar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary dark:text-primary-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configurações do Sistema
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie funcionalidades e regras de negócio
          </p>
        </div>
      </div>

      {/* Card: Contratos por Mês */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Contratos por Mês
              </h3>
              {contractsPerMonthEnabled ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ✓ Ativado
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  ✕ Desativado
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Quando ativado, os consultores precisam atingir um número mínimo de
              contratos por mês para subir de nível:
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 ml-4">
              <li>• Master: 2 contratos/mês</li>
              <li>• Sênior: 4 contratos/mês</li>
              <li>• Prime: 5 contratos/mês</li>
              <li>• Executive: 10 contratos/mês</li>
            </ul>

            {!contractsPerMonthEnabled && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  <strong>Atenção:</strong> Quando desativado, consultores podem subir de
                  nível apenas com pontos, independente do número de contratos.
                </div>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleContractsPerMonth}
            disabled={isSaving}
            className={`
              relative inline-flex h-12 w-24 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${contractsPerMonthEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}
              ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
            `}
          >
            <span className="sr-only">Ativar contratos por mês</span>
            <span
              className={`
                pointer-events-none inline-block h-11 w-11 transform rounded-full bg-white shadow ring-0 
                transition duration-200 ease-in-out flex items-center justify-center
                ${contractsPerMonthEnabled ? 'translate-x-12' : 'translate-x-0'}
              `}
            >
              {contractsPerMonthEnabled ? (
                <ToggleRight className="w-6 h-6 text-green-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
            </span>
          </button>
        </div>

        {/* Última atualização */}
        {settings.find((s) => s.setting_key === 'contracts_per_month_enabled') && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Última atualização:{' '}
              {new Date(
                settings.find((s) => s.setting_key === 'contracts_per_month_enabled')!
                  .updated_at
              ).toLocaleString('pt-BR')}{' '}
              {settings.find((s) => s.setting_key === 'contracts_per_month_enabled')!
                .updated_by_name && (
                <>
                  por{' '}
                  <span className="font-medium">
                    {
                      settings.find(
                        (s) => s.setting_key === 'contracts_per_month_enabled'
                      )!.updated_by_name
                    }
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="space-y-1 ml-4">
              <li>
                • <strong>Ativado:</strong> Consultores precisam atingir pontos E contratos
                mínimos mensais
              </li>
              <li>
                • <strong>Desativado:</strong> Consultores sobem de nível apenas com pontos
              </li>
              <li>
                • A mudança é aplicada imediatamente em todo o sistema
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
