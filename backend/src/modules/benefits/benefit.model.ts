// backend/src/modules/benefits/benefit.model.ts

export interface Benefit {
  id: string;
  level_id: string;
  title: string;
  description: string;
  category: string; // 'kit', 'electronics', 'dinner', 'travel', etc
  period: string; // 'monthly', 'quarterly', 'annual', 'advancement'
  image_url: string | null;
  terms: string | null;
  is_active: boolean;
  created_at: Date;
}
