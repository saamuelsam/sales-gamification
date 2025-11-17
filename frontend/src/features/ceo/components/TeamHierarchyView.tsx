import { useState } from 'react';
import { 
  Users, 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  DollarSign, 
  Award,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  current_level: string;
  accumulated_points: number;
  manager_name?: string;
  manager_id?: string;
  director_name?: string;
  director_id?: string;
  direct_reports: number;
  clients_count: number;
  total_sales_value: number;
  sales_count: number;
}

interface TeamHierarchyViewProps {
  teamMembers: TeamMember[];
  loading: boolean;
  roleLabels: Record<string, string>;
}

interface HierarchyNode {
  member: TeamMember;
  children: HierarchyNode[];
  level: number;
}

export function TeamHierarchyView({ teamMembers, loading, roleLabels }: TeamHierarchyViewProps) {
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);

  // Filtrar apenas líderes (membros que têm subordinados)
  const leaders = teamMembers.filter(member => member.direct_reports > 0);

  // Construir árvore hierárquica recursiva
  const buildHierarchy = (leaderId: string, level: number = 0): HierarchyNode | null => {
    const member = teamMembers.find(m => m.id === leaderId);
    if (!member) return null;

    const children = teamMembers
      .filter(m => m.manager_id === leaderId)
      .map(child => buildHierarchy(child.id, level + 1))
      .filter((node): node is HierarchyNode => node !== null);

    return { member, children, level };
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectLeader = (leader: TeamMember) => {
    setSelectedLeaderId(leader.id);
    setBreadcrumbs([{ id: leader.id, name: leader.name }]);
    setExpandedNodes(new Set());
  };

  const handleNodeClick = (node: HierarchyNode) => {
    if (node.children.length > 0) {
      const alreadyInBreadcrumb = breadcrumbs.find(b => b.id === node.member.id);
      if (!alreadyInBreadcrumb) {
        setBreadcrumbs([...breadcrumbs, { id: node.member.id, name: node.member.name }]);
      }
      toggleNode(node.member.id);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    const nodeId = breadcrumbs[index].id;
    setExpandedNodes(new Set([nodeId]));
  };

  const handleBack = () => {
    setSelectedLeaderId(null);
    setBreadcrumbs([]);
    setExpandedNodes(new Set());
  };

  const getRoleBadgeStyle = (role: string) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'CEO') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300';
    if (roleUpper === 'DIRETOR_COMERCIAL') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
    if (roleUpper === 'GERENTE' || roleUpper === 'DIRECTOR') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300';
    if (roleUpper.includes('CONSULTANT') || roleUpper === 'CONSULTOR') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300';
  };

  const renderMemberCard = (node: HierarchyNode, isExpandable: boolean = false) => {
    const { member, children, level } = node;
    const isExpanded = expandedNodes.has(member.id);
    const hasChildren = children.length > 0;

    return (
      <div key={member.id} style={{ marginLeft: `${level * 2}rem` }} className="mb-4">
        <div 
          className={hasChildren && isExpandable ? 'cursor-pointer' : ''}
          onClick={() => isExpandable && hasChildren && handleNodeClick(node)}
        >
          <Card 
            className={`p-4 transition-all duration-200 hover:shadow-lg border-2 ${
              isExpanded ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {isExpandable && hasChildren && (
                  <button className="mt-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{member.name}</h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleBadgeStyle(member.role)}`}>
                      {roleLabels[member.role.toLowerCase()] || member.role}
                    </span>
                    {hasChildren && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {children.length} subordinado{children.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{member.email}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pontos</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{member.accumulated_points || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Clientes</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{member.clients_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vendas</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{member.sales_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receita</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          R$ {(member.total_sales_value / 1000).toFixed(1)}k
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {member.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {isExpandable && isExpanded && children.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-primary/30 ml-6">
            {children.map(child => renderMemberCard(child, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando hierarquia da equipe...</p>
        </div>
      </Card>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum membro encontrado</h3>
          <p className="text-gray-500 dark:text-gray-400">Adicione membros à equipe para visualizar a hierarquia</p>
        </div>
      </Card>
    );
  }

  // Visualização de líderes (view inicial)
  if (!selectedLeaderId) {
    return (
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Hierarquia da Equipe
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Selecione um líder para visualizar sua equipe completa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map(leader => (
            <div
              key={leader.id}
              className="cursor-pointer"
              onClick={() => handleSelectLeader(leader)}
            >
              <Card className="p-5 hover:shadow-xl transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 hover:border-primary">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{leader.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getRoleBadgeStyle(leader.role)}`}>
                      {roleLabels[leader.role.toLowerCase()] || leader.role}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{leader.email}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Equipe</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{leader.direct_reports}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Vendas</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{leader.sales_count}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Clientes</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{leader.clients_count}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pontos</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{leader.accumulated_points || 0}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {leaders.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum líder encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400">Os líderes aparecerão aqui quando tiverem subordinados</p>
          </div>
        )}
      </Card>
    );
  }

  // Visualização da hierarquia de um líder específico
  const hierarchy = buildHierarchy(selectedLeaderId);
  
  if (!hierarchy) {
    return (
      <Card className="p-6">
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Líderes
        </button>
        <div className="text-center py-8 text-gray-500">Erro ao carregar hierarquia</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Líderes
        </button>

        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <Users className="w-4 h-4 text-gray-500" />
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {renderMemberCard(hierarchy, true)}
      </div>
    </Card>
  );
}
