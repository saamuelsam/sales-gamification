import { Building2, DollarSign, Zap, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Sale {
  id: string;
  client_name: string;
  value: number;
  kilowatts: number;
  sale_type: 'direct' | 'consortium' | 'cash';
  consortium_value?: number;
  created_at: string;
}

interface SaleCardProps {
  sale: Sale;
  onClick?: () => void;
}

export const SaleCard = ({ sale, onClick }: SaleCardProps) => {
  const getSaleTypeInfo = (type: string) => {
    switch (type) {
      case 'consortium':
        return { label: 'Consórcio', color: 'purple' as const, icon: Building2 };
      case 'cash':
        return { label: 'À Vista', color: 'green' as const, icon: DollarSign };
      default:
        return { label: 'Financiamento', color: 'blue' as const, icon: DollarSign };
    }
  };

  const typeInfo = getSaleTypeInfo(sale.sale_type);
  const TypeIcon = typeInfo.icon;

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{sale.client_name}</h4>
          <p className="text-sm text-gray-600 mt-1 flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            {sale.kilowatts} kW
          </p>
        </div>
        <Badge variant={typeInfo.color}>
          <TypeIcon className="w-3 h-3 mr-1 inline" />
          {typeInfo.label}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Valor:</span>
          <span className="font-semibold text-gray-900">
            R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {sale.sale_type === 'consortium' && sale.consortium_value && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Consórcio:</span>
            <span className="font-semibold text-purple-600">
              R$ {sale.consortium_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data:</span>
          <span className="text-gray-900 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(sale.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
};
