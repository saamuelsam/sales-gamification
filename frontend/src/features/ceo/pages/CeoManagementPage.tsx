// frontend/src/features/ceo/pages/CeoManagementPage.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  User,
  Shield,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Award,
  Search,
  Filter,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  RefreshCw,
  Lock,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';

interface Consultant {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  is_active: boolean;
  created_at: string;
  parent_name?: string;
  total_sales: number;
  total_revenue: number;
  team_size: number;
  total_commissions: number;
}

interface ConsultantDetails {
  user: Consultant & {
    personal_commissions: number;
    network_commissions: number;
  };
  team: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    is_active: boolean;
  }>;
  recent_sales: Array<{
    id: string;
    value: number;
    kilowatts: number;
    status: string;
    created_at: string;
    client_name: string;
  }>;
}

export function CeoManagementPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Forms
  const [editForm, setEditForm] = useState<Partial<Consultant>>({});
  const [pointsForm, setPointsForm] = useState({ points: 0, reason: '' });
  const [saleForm, setSaleForm] = useState({
    client_id: '',
    value: 0,
    kilowatts: 0,
    description: '',
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '' });

  useEffect(() => {
    fetchConsultants();
  }, [roleFilter, activeFilter]);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== undefined) params.active = activeFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/ceo/consultants', { params });
      setConsultants(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      toast.error('Erro ao carregar consultores');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultantDetails = async (id: string) => {
    try {
      const res = await api.get(`/ceo/consultants/${id}`);
      setSelectedConsultant(res.data?.data || null);
      setShowDetails(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do consultor');
    }
  };

  const handleUpdateConsultant = async () => {
    if (!selectedConsultant) return;
    
    try {
      await api.put(`/ceo/consultants/${selectedConsultant.user.id}`, editForm);
      toast.success('Consultor atualizado com sucesso');
      setShowEditModal(false);
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar consultor');
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!selectedConsultant) return;
    
    try {
      await api.patch(`/ceo/consultants/${selectedConsultant.user.id}/role`, { role: newRole });
      toast.success('Cargo alterado com sucesso');
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar cargo');
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedConsultant || !pointsForm.reason) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    try {
      await api.patch(`/ceo/consultants/${selectedConsultant.user.id}/points`, pointsForm);
      toast.success('Pontos ajustados com sucesso');
      setShowPointsModal(false);
      setPointsForm({ points: 0, reason: '' });
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao ajustar pontos');
    }
  };

  const handleCreateSale = async () => {
    if (!selectedConsultant || !saleForm.client_id || !saleForm.value || !saleForm.kilowatts) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      await api.post(`/ceo/consultants/${selectedConsultant.user.id}/sales`, saleForm);
      toast.success('Venda criada com sucesso');
      setShowSaleModal(false);
      setSaleForm({ client_id: '', value: 0, kilowatts: 0, description: '' });
      fetchConsultants();
      fetchConsultantDetails(selectedConsultant.user.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar venda');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/ceo/consultants/${id}/toggle-status`);
      toast.success('Status alterado com sucesso');
      fetchConsultants();
      if (selectedConsultant && selectedConsultant.user.id === id) {
        fetchConsultantDetails(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedConsultant || !passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    try {
      await api.post(`/ceo/consultants/${selectedConsultant.user.id}/reset-password`, passwordForm);
      toast.success('Senha resetada com sucesso');
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao resetar senha');
    }
  };

  const roleLabels: Record<string, string> = {
    consultant: 'Consultor',
    master_consultant: 'Master Consultant',
    senior_consultant: 'Consultor Sênior',
    prime_consultant: 'Consultor Prime',
    executive: 'Executivo',
    director: 'Diretor',
    diretor_comercial: 'Diretor Comercial',
    admin: 'Administrador',
    financeiro: 'Financeiro',
    ceo: 'CEO',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Gestão CEO
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Controle total sobre todos os consultores e suas atividades
          </p>
        </div>
        <button
          onClick={fetchConsultants}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchConsultants()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtro de Cargo */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos os cargos</option>
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Filtro de Status */}
          <select
            value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
            onChange={(e) =>
              setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>

          {/* Botão Aplicar */}
          <button
            onClick={fetchConsultants}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros
          </button>
        </div>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Consultores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{consultants.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {consultants.filter((c) => c.is_active).length}
              </p>
            </div>
            <UserCheck className="w-10 h-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultants.reduce((acc, c) => acc + c.total_sales, 0)}
              </p>
            </div>
            <ShoppingCart className="w-10 h-10 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {consultants.reduce((acc, c) => acc + parseFloat(String(c.total_revenue)), 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Lista de Consultores */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Consultor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Pontos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Receita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : consultants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum consultor encontrado
                  </td>
                </tr>
              ) : (
                consultants.map((consultant) => (
                  <tr
                    key={consultant.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => fetchConsultantDetails(consultant.id)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{consultant.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{consultant.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {roleLabels[consultant.role] || consultant.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {consultant.points?.toLocaleString('pt-BR') || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{consultant.total_sales}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      R$ {parseFloat(String(consultant.total_revenue)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {consultant.is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <UserCheck className="w-4 h-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <UserX className="w-4 h-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(consultant.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title={consultant.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {consultant.is_active ? (
                            <UserX className="w-4 h-4 text-red-600" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchConsultantDetails(consultant.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Ver detalhes"
                        >
                          <Activity className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Detalhes - será implementado na próxima parte */}
      {showDetails && selectedConsultant && (
        <ConsultantDetailsModal
          consultant={selectedConsultant}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setEditForm(selectedConsultant.user);
            setShowEditModal(true);
          }}
          onAdjustPoints={() => setShowPointsModal(true)}
          onCreateSale={() => setShowSaleModal(true)}
          onResetPassword={() => setShowPasswordModal(true)}
          onChangeRole={handleChangeRole}
          roleLabels={roleLabels}
        />
      )}

      {/* Modais de Edição - implementados a seguir */}
    </div>
  );
}

// Componente de Modal de Detalhes (continuação na próxima parte)
function ConsultantDetailsModal({
  consultant,
  onClose,
  onEdit,
  onAdjustPoints,
  onCreateSale,
  onResetPassword,
  onChangeRole,
  roleLabels,
}: {
  consultant: ConsultantDetails;
  onClose: () => void;
  onEdit: () => void;
  onAdjustPoints: () => void;
  onCreateSale: () => void;
  onResetPassword: () => void;
  onChangeRole: (role: string) => void;
  roleLabels: Record<string, string>;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {consultant.user.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{consultant.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargo</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {roleLabels[consultant.user.role] || consultant.user.role}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pontos</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {consultant.user.points?.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {consultant.user.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultant.user.total_sales}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {parseFloat(String(consultant.user.total_revenue)).toLocaleString('pt-BR')}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tamanho da Equipe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultant.user.team_size}
              </p>
            </Card>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={onAdjustPoints}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Award className="w-4 h-4" />
              Ajustar Pontos
            </button>
            <button
              onClick={onCreateSale}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ShoppingCart className="w-4 h-4" />
              Criar Venda
            </button>
            <button
              onClick={onResetPassword}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Lock className="w-4 h-4" />
              Resetar Senha
            </button>
          </div>

          {/* Vendas Recentes */}
          {consultant.recent_sales.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Vendas Recentes
              </h3>
              <div className="space-y-2">
                {consultant.recent_sales.map((sale) => (
                  <Card key={sale.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {sale.client_name || 'Cliente não identificado'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          R$ {parseFloat(String(sale.value)).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sale.kilowatts} kW
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
