// src/features/dashboard/components/PointsProgress.tsx
import { Card } from '@/components/ui/Card';
import { Trophy } from 'lucide-react';

interface PointsProgressProps {
  currentPoints: number;
  currentLevel: string;
  nextLevel: string;
  pointsToNext: number;
  progressPercentage: number;
}

export const PointsProgress = ({
  currentPoints,
  currentLevel,
  nextLevel,
  pointsToNext,
  progressPercentage,
}: PointsProgressProps) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Progresso de Pontos</h3>
        <Trophy className="w-6 h-6 text-yellow-500" />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{currentLevel}</span>
            <span className="text-gray-600">{nextLevel}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {currentPoints} pontos | Faltam {pointsToNext} para o próximo nível
          </p>
        </div>
      </div>
    </Card>
  );
};
