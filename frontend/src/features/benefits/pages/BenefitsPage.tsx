import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import api from '@/services/api';
import { 
  Gift, 
  Check, 
  Package, 
  Laptop, 
  UtensilsCrossed, 
  Plane, 
  Trophy, 
  Car, 
  DollarSign,
  Sparkles,
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react';
import { useState } from 'react';

interface Benefit {
  id: string;
  level_id: string;
  title: string;
  description: string;
  category: 'kit' | 'electronics' | 'dinner' | 'travel' | 'trophy' | 'vehicle' | 'allowance';
  period: 'monthly' | 'quarterly' | 'annual' | 'advancement';
  image_url: string;
  terms: string;
  is_active: boolean;
  level_name: string;
  phase_number: number;
  is_unlocked: boolean;
  created_at: string;
}

const categoryConfig = {
  kit: { icon: Package, label: 'Kit', color: 'blue' },
  electronics: { icon: Laptop, label: 'Eletrônicos', color: 'purple' },
  dinner: { icon: UtensilsCrossed, label: 'Jantares', color: 'orange' },
  travel: { icon: Plane, label: 'Viagens', color: 'cyan' },
  trophy: { icon: Trophy, label: 'Troféus', color: 'yellow' },
  vehicle: { icon: Car, label: 'Veículos', color: 'red' },
  allowance: { icon: DollarSign, label: 'Financeiro', color: 'green' }
};

const periodConfig = {
  monthly: { label: 'Mensal', icon: Calendar },
  quarterly: { label: 'Trimestral', icon: Calendar },
  annual: { label: 'Anual', icon: Calendar },
  advancement: { label: 'Avanço', icon: Sparkles }
};

export const BenefitsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const { data: benefits, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const { data } = await api.get('/benefits/user');
      return data.data as Benefit[];
    },
  });

  // Filtrar benefícios
  const filteredBenefits = benefits?.filter(benefit => {
    if (selectedCategory !== 'all' && benefit.category !== selectedCategory) return false;
    if (selectedLevel !== 'all' && benefit.level_name !== selectedLevel) return false;
    return true;
  });

  // Obter lista única de níveis
  const uniqueLevels = Array.from(new Set(benefits?.map(b => b.level_name) || []));

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600 dark:text-yellow-400" />
          Benefícios
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
          Conquiste benefícios exclusivos conforme você avança de nível
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {benefits?.filter(b => b.is_unlocked).length || 0}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Desbloqueados</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {benefits?.filter(b => b.period === 'monthly').length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mensais</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {benefits?.filter(b => b.period === 'advancement').length || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avanço</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {uniqueLevels.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Níveis</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Filtro de Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
            >
              <option value="all">Todas as categorias</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nível
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
            >
              <option value="all">Todos os níveis</option>
              {uniqueLevels.sort((a, b) => {
                const levelOrder = ['Consultor Elite', 'Master', 'Consultor Sênior', 'Consultor Prime', 'Executivo'];
                return levelOrder.indexOf(a) - levelOrder.indexOf(b);
              }).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Benefícios */}
      {filteredBenefits && filteredBenefits.length > 0 ? (
        <div className="grid gap-3 sm:gap-4">
          {filteredBenefits.map((benefit) => {
            const categoryInfo = categoryConfig[benefit.category];
            const periodInfo = periodConfig[benefit.period];
            const CategoryIcon = categoryInfo.icon;
            const PeriodIcon = periodInfo.icon;

            return (
              <Card key={benefit.id} className={`overflow-hidden hover:shadow-lg transition-all ${!benefit.is_unlocked ? 'opacity-60' : ''}`}>
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                  {/* Imagem */}
                  <div className={`relative w-full md:w-48 h-40 sm:h-48 md:h-auto flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg md:rounded-none ${!benefit.is_unlocked ? 'grayscale' : ''}`}>
                    {benefit.image_url ? (
                      <img 
                        src={benefit.image_url} 
                        alt={benefit.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CategoryIcon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                      </div>
                    )}
                    
                    {/* Badge de Status */}
                    <div className="absolute top-3 right-3">
                      {benefit.is_unlocked ? (
                        <div className="bg-green-500 dark:bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <Check className="w-3 h-3" />
                          Desbloqueado
                        </div>
                      ) : (
                        <div className="bg-gray-500 dark:bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Bloqueado
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-3 sm:p-4 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {benefit.title}
                        </h3>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* Badge de Categoria */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                            ${categoryInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
                            ${categoryInfo.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : ''}
                            ${categoryInfo.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : ''}
                            ${categoryInfo.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' : ''}
                            ${categoryInfo.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : ''}
                            ${categoryInfo.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
                            ${categoryInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
                          `}>
                            <CategoryIcon className="w-3 h-3" />
                            {categoryInfo.label}
                          </span>

                          {/* Badge de Período */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <PeriodIcon className="w-3 h-3" />
                            {periodInfo.label}
                          </span>

                          {/* Badge de Nível */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            <Trophy className="w-3 h-3" />
                            {benefit.level_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4">
                      {benefit.description}
                    </p>

                    {/* Termos e Condições */}
                    {benefit.terms && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 flex items-center gap-1">
                          <ChevronRight className="w-4 h-4" />
                          Termos e Condições
                        </summary>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 pl-5 border-l-2 border-gray-200 dark:border-gray-700">
                          {benefit.terms}
                        </p>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Gift className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Nenhum benefício encontrado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCategory !== 'all' || selectedLevel !== 'all'
                  ? 'Tente ajustar os filtros para ver mais benefícios.'
                  : 'Continue vendendo e avançando de nível para desbloquear benefícios incríveis!'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Seção de Progresso */}
      {benefits && benefits.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                Continue Evoluindo!
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Você já desbloqueou <strong>{benefits.length} benefícios</strong>! 
                Continue vendendo e liderando sua equipe para conquistar ainda mais recompensas exclusivas.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
