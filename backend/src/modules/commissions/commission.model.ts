// backend/src/modules/commissions/commission.model.ts

export interface Commission {
  id: string;
  user_id: string;
  sale_id: string;
  sale_commission: number;
  insurance_commission: number;
  total_commission: number;
  paid: boolean;
  paid_at: Date | null;
  created_at: Date;
}

export interface CommissionSummary {
  user_id: string;
  user_name: string;
  total_earned: number;
  total_paid: number;
  total_pending: number;
  count_paid: number;
  count_pending: number;
}
