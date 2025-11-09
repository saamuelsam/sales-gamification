import { useEffect, useState } from 'react';
import { DollarSign, Users, Award, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import  api  from '@/services/api';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data?.data || {});
      } catch (error) {
        console.error('Erro ao buscar estatísticas do admin:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const mockSalesData = [
    { month: 'Jan', revenue: 32000 },
    { month: 'Fev', revenue: 41000 },
    { month: 'Mar', revenue: 38000 },
    { month: 'Abr', revenue: 54000 },
  ];

  const statCards = [
    { label: 'Consultores Ativos', value: stats?.total_users || 0, icon: <Users className="w-6 h-6 text-blue-600" /> },
    { label: 'Equipes', value: stats?.total_teams || 0, icon: <Award className="w-6 h-6 text-yellow-600" /> },
    { label: 'Faturamento Total', value: `R$ ${(stats?.total_sales || 0).toLocaleString('pt-BR')}`, icon: <DollarSign className="w-6 h-6 text-green-600" /> },
    { label: 'Comissões Pagas', value: `R$ ${(stats?.total_commissions_paid || 0).toLocaleString('pt-BR')}`, icon: <Zap className="w-6 h-6 text-purple-600" /> },
  ];

  if (loading) return <p className="text-center mt-10 text-gray-500">Carregando painel...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-500 text-sm sm:text-base">Visão geral do desempenho do sistema</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <Card key={idx} className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{card.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            {card.icon}
          </Card>
        ))}
      </div>

      {/* Gráfico */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Faturamento Mensal</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mockSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
