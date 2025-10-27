// src/features/benefits/pages/BenefitsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import api from '@/services/api';
import { Gift, Lock, Check } from 'lucide-react';

export const BenefitsPage = () => {
  const { data: benefits, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const { data } = await api.get('/benefits/user');
      return data.data;
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Gift className="w-7 h-7 text-yellow-600" />
          Benefícios
        </h1>
        <p className="text-gray-600 mt-1">Veja seus benefícios desbloqueados</p>
      </div>

      <div className="grid gap-4">
        {benefits?.map((benefit: any) => (
          <Card key={benefit.id}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                benefit.unlocked ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {benefit.unlocked ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{benefit.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                <div className="mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    benefit.unlocked 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {benefit.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
