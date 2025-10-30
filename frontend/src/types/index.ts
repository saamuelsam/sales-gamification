export type SaleType = 'direct' | 'consortium' | 'cash' | 'card';

export interface Sale {
  id: string;
  user_id: string;
  client_id?: string;
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  sale_type: SaleType;
  consortium_value?: number;
  consortium_term?: number;
  consortium_monthly_payment?: number;
  consortium_admin_fee?: number;
  template_type?: string;
  notes?: string;
  status: 'pending' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface CreateSaleData {
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  sale_type?: SaleType;
  consortium_value?: number;
  consortium_term?: number;
  consortium_monthly_payment?: number;
  consortium_admin_fee?: number;
  notes?: string;
}
