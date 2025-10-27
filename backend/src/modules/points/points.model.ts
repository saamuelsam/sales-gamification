// backend/src/modules/points/points.model.ts

export interface Point {
  id: string;
  user_id: string;
  sale_id: string | null;
  points: number;
  accumulated_points: number;
  description: string;
  created_at: Date;
}

export interface UserPointsSummary {
  user_id: string;
  user_name: string;
  total_points: number;
  current_level: string;
  next_level: string;
  points_to_next_level: number;
  progress_percentage: number;
}
