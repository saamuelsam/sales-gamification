import { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface LevelConfig {
    name: string;
    phase_number: number;
    personal_commission: number;
    insurance_commission: number;
    network_commission: number;
    fixed_allowance: number | null;
    advancement_bonus: number;
    advancement_reward: string;
    monthly_sales_goal: number | null;
    max_lines: number;
}

interface GoalsData {
    currentLevel: LevelConfig;
    currentPoints: number;
    nextLevel: LevelConfig | null;
    progressPercentage: number;
    pointsToNextLevel: number;
    requirements: {
        minContracts: number;
        minSalesValue: number;
        bonusGoal: number;
    };
}

export const GoalsPage = () => {
    const [goals, setGoals] = useState<GoalsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGoals();
        const interval = setInterval(fetchGoals, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/levels/goals/my-goals');
            setGoals(data.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erro ao carregar metas';
            setError(message);
            toast.error(message);
            console.error('Erro ao carregar metas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando suas metas...</p>
                </div>
            </div>
        );
    }

    if (error || !goals) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Erro ao carregar</h2>
                    <p className="text-gray-600 mb-4">{error || 'Não conseguimos carregar suas metas'}</p>
                    <button
                        onClick={fetchGoals}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    const levelColors: Record<string, string> = {
        'Consultor Elite': 'from-blue-500 to-blue-600',
        'Master': 'from-purple-500 to-purple-600',
        'Consultor Sênior': 'from-pink-500 to-pink-600',
        'Consultor Prime': 'from-amber-500 to-amber-600',
        'Executivo': 'from-green-500 to-green-600',
    };

    const currentLevelColor = levelColors[goals.currentLevel.name] || 'from-blue-500 to-blue-600';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Suas Metas
                    </h1>
                    <p className="text-gray-600">Acompanhe seu progresso na carreira</p>
                </div>

                {/* Nível Atual */}
                <div className={`bg-gradient-to-r ${currentLevelColor} rounded-2xl shadow-xl p-6 sm:p-8 text-white`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm opacity-90 mb-1">Seu Nível Atual</p>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{goals.currentLevel.name}</h2>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-lg font-semibold">{goals.currentPoints.toLocaleString('pt-BR')} pontos</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm opacity-90">Comissão Pessoal</p>
                            <p className="text-4xl font-bold">{goals.currentLevel.personal_commission}%</p>
                            <p className="text-sm opacity-90">+ {goals.currentLevel.insurance_commission}% (Seguro)</p>
                        </div>
                    </div>
                </div>

                {/* Benefícios Atuais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.currentLevel.advancement_bonus > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                            <Award className="w-8 h-8 text-yellow-500 mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Bônus</h3>
                            <p className="text-2xl font-bold text-green-600">
                                R$ {goals.currentLevel.advancement_bonus.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    )}

                    {goals.currentLevel.fixed_allowance && goals.currentLevel.fixed_allowance > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                            <Trophy className="w-8 h-8 text-blue-500 mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-2">Ajuda de Custo</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                R$ {goals.currentLevel.fixed_allowance.toLocaleString('pt-BR')}/mês
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        <Trophy className="w-8 h-8 text-purple-500 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Prêmio Especial</h3>
                        <p className="text-sm font-medium text-purple-600">{goals.currentLevel.advancement_reward || 'Sem prêmio especial'}</p>
                    </div>
                </div>

                {/* Requisitos Atuais */}
{goals.requirements && (goals.requirements.minContracts > 0 || goals.requirements.minSalesValue > 0) && (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Target className="w-5 h-5" />
      Requisitos do Seu Nível
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {goals.requirements.minContracts > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Linhas Máximas</p>
          <p className="text-2xl font-bold text-blue-700">{goals.requirements.minContracts}</p>
        </div>
      )}
      {goals.requirements.minSalesValue > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 mb-1">Meta de Vendas/Mês</p>
          <p className="text-2xl font-bold text-green-700">
            R$ {(goals.requirements.minSalesValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
          </p>
        </div>
      )}
    </div>
  </div>
)}


                {/* Próximo Nível */}
                {goals.nextLevel && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            🎯 Próximo Nível: {goals.nextLevel.name}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Progresso</span>
                                    <span className="text-sm font-bold text-blue-600">{Math.round(goals.progressPercentage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, goals.progressPercentage)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Faltam <strong>{goals.pointsToNextLevel.toLocaleString('pt-BR')}</strong> pontos para atingir o próximo nível
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-600 mb-1">Nova Comissão Pessoal</p>
                                    <p className="text-2xl font-bold text-purple-700">{goals.nextLevel.personal_commission}%</p>
                                </div>
                                {goals.nextLevel.fixed_allowance && goals.nextLevel.fixed_allowance > (goals.currentLevel.fixed_allowance || 0) && (
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm text-green-600 mb-1">Nova Ajuda de Custo</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            R$ {goals.nextLevel.fixed_allowance.toLocaleString('pt-BR')}/mês
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
