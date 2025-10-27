// backend/src/modules/levels/level.model.ts

export interface Level {
  id: string;
  phase_number: number;
  name: string;
  subtitle: string;
  points_required: number;
  max_lines: number;
  personal_commission: number;
  insurance_commission: number;
  network_commission: number | null;
  fixed_allowance: number | null;
  monthly_sales_goal: number | null;
  bonus_goal: number | null;
  bonus_allowance: number | null;
  advancement_bonus: number | null;
  advancement_reward: string | null;
  created_at: Date;
}
