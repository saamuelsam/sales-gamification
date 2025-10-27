// src/features/dashboard/components/TeamMembersTable.tsx
import { Card } from '@/components/ui/Card';
import { Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  total_points: number;
  total_sales: number;
  total_revenue: number;
}

interface TeamMembersTableProps {
  members: TeamMember[];
}

export const TeamMembersTable = ({ members }: TeamMembersTableProps) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Minha Equipe</h3>
        <Users className="w-6 h-6 text-primary-600" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Pontos</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Vendas</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Receita</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">{member.total_points}</td>
                <td className="py-3 px-4">{member.total_sales}</td>
                <td className="py-3 px-4 text-right">
                  R$ {member.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
