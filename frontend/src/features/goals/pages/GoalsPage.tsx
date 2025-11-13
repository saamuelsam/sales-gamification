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
    bonus_goal: number | null;
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
    
    // ✅ NOVO - Estados para o Modal de Meta
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalNotification, setGoalNotification] = useState<{
        title: string;
        message: string;
        reward?: string;
    } | null>(null);

    useEffect(() => {
        fetchGoals();

        // ✅ NOVO - Verificar notificações de meta a cada 10 segundos
        const checkGoalNotifications = async () => {
            try {
                const response = await api.get('/notifications?limit=5');
                const goalNotif = response.data?.data?.find((n: any) => n.type === 'goal' && !n.is_read);

                if (goalNotif) {
                    // Marcar como lida
                    await api.put(`/notifications/${goalNotif.id}/read`);

                    // Mostrar modal
                    setShowGoalModal(true);
                    setGoalNotification({
                        title: goalNotif.title,
                        message: goalNotif.message,
                        reward: goalNotif.metadata?.reward,
                    });

                    // Recarregar metas após 2 segundos
                    setTimeout(() => {
                        fetchGoals();
                    }, 2000);
                }
            } catch (error) {
                console.error('Erro ao verificar notificações de meta:', error);
            }
        };

        checkGoalNotifications();
        const notifInterval = setInterval(checkGoalNotifications, 10000);

        // Atualizar APENAS quando o usuário volta para a aba
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchGoals();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(notifInterval); // ✅ NOVO
        };
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get('/levels/goals/my-goals');
            setGoals(data.data);

            // Se mudou de nível, mostrar notificação
            if (data.data.currentLevel.name !== goals?.currentLevel.name) {
                toast.success(`🆙 Parabéns! Você passou para ${data.data.currentLevel.name}!`);
            }
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando suas metas...</p>
                </div>
            </div>
        );
    }

    if (error || !goals) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center max-w-md border dark:border-gray-700">
                    <div className="text-red-500 dark:text-red-400 text-4xl mb-4">⚠️</div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Erro ao carregar</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Não conseguimos carregar suas metas'}</p>
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

    // Função para obter requisitos específicos por nível
    const getRequirements = (levelName: string) => {
        if (levelName === 'Master') {
            return { contracts: 2, salesGoal: null };
        } else if (levelName === 'Consultor Sênior') {
            return { contracts: 4, salesGoal: 500000 };
        } else if (levelName === 'Consultor Prime') {
            return { contracts: 5, salesGoal: 500000 };
        } else if (levelName === 'Executivo') {
            return { contracts: null, salesGoal: 400000 };
        }
        return { contracts: null, salesGoal: null };
    };

    const currentRequirements = getRequirements(goals.currentLevel.name);
    const nextRequirements = goals.nextLevel ? getRequirements(goals.nextLevel.name) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                        <Trophy className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
                        Suas Metas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Acompanhe seu progresso na carreira</p>
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
                            <p className="text-sm opacity-90">+ {goals.currentLevel.insurance_commission}% (Seguro)
                                {goals.currentLevel.network_commission && ` + ${goals.currentLevel.network_commission}% (Rede)`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Benefícios Atuais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.currentLevel.advancement_bonus > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <Award className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bônus de Avanço</h3>
                            <p className="text-2xl font-bold text-green-600">
                                R$ {goals.currentLevel.advancement_bonus.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    )}

                    {goals.currentLevel.fixed_allowance && goals.currentLevel.fixed_allowance > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <Trophy className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Ajuda de Custo</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                R$ {goals.currentLevel.fixed_allowance.toLocaleString('pt-BR')}/mês
                            </p>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <Trophy className="w-8 h-8 text-purple-500 dark:text-purple-400 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Prêmio Especial</h3>
                        <p className="text-sm font-medium text-purple-600">{goals.currentLevel.advancement_reward || 'Sem prêmio especial'}</p>
                    </div>
                </div>

                {/* Requisitos Atuais */}
                {(currentRequirements.contracts || currentRequirements.salesGoal || goals.currentLevel.bonus_goal) && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Requisitos do Seu Nível
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentRequirements.contracts && (
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Contratos/Mês</p>
                                    <p className="text-2xl font-bold text-purple-700">{currentRequirements.contracts}</p>
                                </div>
                            )}

                            {currentRequirements.salesGoal && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">Meta de Vendas/Mês</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        R$ {(currentRequirements.salesGoal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                                    </p>
                                </div>
                            )}

                            {goals.currentLevel.name === 'Executivo' && goals.currentLevel.bonus_goal && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Meta Bônus (R$ 5.000)</p>
                                    <p className="text-2xl font-bold text-amber-700">
                                        R$ {(goals.currentLevel.bonus_goal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k
                                    </p>
                                </div>
                            )}

                            {/* Nota sobre equipe */}
                            {['Consultor Sênior', 'Consultor Prime', 'Executivo'].includes(goals.currentLevel.name) && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 col-span-full">
                                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">📊 IMPORTANTE</p>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Pontos e vendas incluem sua equipe geral</p>
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
                            {/* Progresso */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(goals.progressPercentage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, goals.progressPercentage)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    Faltam <strong>{goals.pointsToNextLevel.toLocaleString('pt-BR')}</strong> pontos para atingir o próximo nível
                                </p>
                            </div>

                            {/* Benefícios do próximo nível */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Nova Comissão Pessoal</p>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{goals.nextLevel.personal_commission}%</p>
                                </div>
                                {goals.nextLevel.fixed_allowance && goals.nextLevel.fixed_allowance > (goals.currentLevel.fixed_allowance || 0) && (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">Nova Ajuda de Custo</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            R$ {goals.nextLevel.fixed_allowance.toLocaleString('pt-BR')}/mês
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Requisitos do próximo nível */}
                            {nextRequirements && (nextRequirements.contracts || nextRequirements.salesGoal) && (
                                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300 mb-3">📋 Requisitos para {goals.nextLevel.name}</p>
                                    <div className="space-y-2">
                                        {nextRequirements.contracts && (
                                            <p className="text-sm text-orange-600 dark:text-orange-400">
                                                • Contratos/Mês: <strong>{nextRequirements.contracts}</strong>
                                            </p>
                                        )}
                                        {nextRequirements.salesGoal && (
                                            <p className="text-sm text-orange-600">
                                                • Meta de Vendas: <strong>R$ {(nextRequirements.salesGoal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k</strong>
                                            </p>
                                        )}
                                        {goals.nextLevel.advancement_bonus > 0 && (
                                            <p className="text-sm text-orange-600">
                                                • Bônus de Avanço: <strong>R$ {goals.nextLevel.advancement_bonus.toLocaleString('pt-BR')}</strong>
                                            </p>
                                        )}
                                        {goals.nextLevel.advancement_reward && (
                                            <p className="text-sm text-orange-600">
                                                • Prêmio: <strong>{goals.nextLevel.advancement_reward}</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ✅ MODAL DE META */}
                {showGoalModal && goalNotification && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-bounce border dark:border-gray-700">
                            {/* Icon */}
                            <div className="text-6xl text-center mb-4">🏆</div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-3">
                                {goalNotification.title}
                            </h2>

                            {/* Message */}
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                                {goalNotification.message}
                            </p>

                            {/* Reward Badge */}
                            {goalNotification.reward && (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg p-4 text-center mb-6 font-bold text-lg">
                                    🎁 {goalNotification.reward}
                                </div>
                            )}

                            {/* Button */}
                            <button
                                onClick={() => {
                                    setShowGoalModal(false);
                                    setGoalNotification(null);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
