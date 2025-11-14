import { useEffect, useState } from 'react';
import { Award, TrendingUp, Target, Gift, Zap } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Level {
  id: string;
  name: string;
  min_points: number;
  max_points: number | null;
  commission_personal: number;
  commission_network: number;
  benefits: string;
  color: string;
}

interface UserProgress {
  currentLevel: Level;
  nextLevel: Level | null;
  currentPoints: number;
  pointsToNext: number;
  progressPercentage: number;
}

export function LevelsPage() {
  const { user } = useAuthStore();
  const [levels, setLevels] = useState<Level[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [levelsRes, progressRes] = await Promise.all([
        api.get('/levels'),
        api.get('/users/me/level')
      ]);

      if (levelsRes.data.success) {
        setLevels(levelsRes.data.data);
      }

      if (progressRes.data.success) {
        setUserProgress(progressRes.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Plano de Carreira
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Acompanhe sua evolução e veja os benefícios de cada nível
        </p>
      </div>

      {/* Progresso Atual */}
      {userProgress && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{userProgress.currentLevel.name}</h2>
              <p className="text-blue-100">Seu nível atual</p>
            </div>
            <Award className="h-12 w-12 text-blue-100" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{userProgress.currentPoints} pontos</span>
              {userProgress.nextLevel && (
                <span>{userProgress.pointsToNext} pontos para o próximo nível</span>
              )}
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${userProgress.progressPercentage}%` }}
              />
            </div>
            {userProgress.nextLevel && (
              <p className="text-sm text-blue-100">
                Próximo: {userProgress.nextLevel.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lista de Níveis */}
      <div className="grid gap-6">
        {levels.map((level, index) => {
          const isCurrentLevel = userProgress?.currentLevel.id === level.id;
          const isPastLevel = userProgress && userProgress.currentPoints >= level.min_points;
          
          return (
            <div
              key={level.id}
              className={`relative rounded-lg border-2 transition-all ${
                isCurrentLevel
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                  : isPastLevel
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Badge do nível atual */}
              {isCurrentLevel && (
                <div className="absolute -top-3 left-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Seu Nível Atual
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: level.color + '20' }}
                    >
                      <Award
                        className="h-6 w-6"
                        style={{ color: level.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {level.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {level.min_points} - {level.max_points || '∞'} pontos
                      </p>
                    </div>
                  </div>

                  {isPastLevel && !isCurrentLevel && (
                    <Zap className="h-6 w-6 text-green-500" />
                  )}
                </div>

                {/* Comissões */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Comissão Pessoal
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {level.commission_personal}%
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Comissão de Rede
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {level.commission_network}%
                    </p>
                  </div>
                </div>

                {/* Benefícios */}
                {level.benefits && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                        Benefícios
                      </span>
                    </div>
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      {level.benefits}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Como ganhar pontos?
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Realize vendas para acumular pontos</li>
          <li>• Construa sua rede e ganhe pontos pelas vendas do seu time</li>
          <li>• Complete metas mensais para bônus extras</li>
          <li>• Participe de treinamentos e eventos especiais</li>
        </ul>
      </div>
    </div>
  );
}
