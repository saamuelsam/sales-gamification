import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import { Users, Search, RefreshCw, DollarSign, Award, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamData {
  id: string;
  leader_name: string;
  leader_email: string;
  total_members: number;
  total_sales: number;
  total_points: number;
  created_at: string;
}

export function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/teams');
      setTeams(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
      toast.error('Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(
    (team) =>
      team.leader_name.toLowerCase().includes(search.toLowerCase()) ||
      team.leader_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipes</h1>
          <p className="text-gray-600 text-sm">Visualize e gerencie todas as equipes do sistema</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar líder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            onClick={fetchTeams}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Equipes Cadastradas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{teams.length}</p>
          </div>
          <Users className="w-6 h-6 text-blue-600" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Faturamento Total</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              R$ {teams.reduce((sum, t) => sum + t.total_sales, 0).toLocaleString('pt-BR')}
            </p>
          </div>
          <DollarSign className="w-6 h-6 text-green-600" />
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Pontos Totais</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {teams.reduce((sum, t) => sum + t.total_points, 0).toLocaleString('pt-BR')}
            </p>
          </div>
          <Award className="w-6 h-6 text-amber-500" />
        </Card>
      </div>

      {/* Tabela de Equipes */}
      <Card className="p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-3 text-left font-semibold">Líder</th>
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-center font-semibold">Membros</th>
              <th className="p-3 text-center font-semibold">Faturamento</th>
              <th className="p-3 text-center font-semibold">Pontos</th>
              <th className="p-3 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => (
              <tr
                key={team.id}
                className="border-b hover:bg-gray-50 transition-colors text-gray-800"
              >
                <td className="p-3 font-medium">{team.leader_name}</td>
                <td className="p-3">{team.leader_email}</td>
                <td className="p-3 text-center">{team.total_members}</td>
                <td className="p-3 text-center text-green-600 font-semibold">
                  R$ {team.total_sales.toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-center text-amber-600 font-semibold">
                  {team.total_points.toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-center flex justify-center gap-3">
                  <button
                    onClick={() => toast('Ver equipe (em breve...)')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Ver equipe"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTeams.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma equipe encontrada</p>
          </div>
        )}
      </Card>
    </div>
  );
}
