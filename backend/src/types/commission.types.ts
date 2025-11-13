export interface CommissionSummary {
  total_commissions: number;
  unpaid_commissions: number;
  paid_commissions: number;
  total_unpaid: number;
  total_paid: number;
  total_earned: number;
}

export interface CompleteCommissionSummary {
  personal: CommissionSummary | null;
  network: CommissionSummary | null;
  total_earned: number;
  total_paid: number;
  total_pending: number;
}
