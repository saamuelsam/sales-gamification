// frontend/src/types/appointment.ts

export interface Appointment {
  id: string;
  user_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  appointment_date: string;
  duration_minutes: number;
  type: 'visit' | 'quotation' | 'installation' | 'maintenance' | 'follow_up' | 'other';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  title: string;
  description?: string;
  location?: string;
  estimated_power?: number;
  estimated_value?: number;
  result?: 'sale_closed' | 'proposal_sent' | 'follow_up_needed' | 'lost' | 'pending';
  notes?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  user_name?: string;
  user_email?: string;
}

export interface AppointmentStats {
  scheduled: string;
  confirmed: string;
  completed: string;
  cancelled: string;
  sales_closed: string;
  proposals_sent: string;
  lost: string;
  today: string;
  this_week: string;
}

export interface CreateAppointmentData {
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  appointment_date: string;
  duration_minutes?: number;
  type: 'visit' | 'quotation' | 'installation' | 'maintenance' | 'follow_up' | 'other';
  title: string;
  description?: string;
  location?: string;
  estimated_power?: number;
  estimated_value?: number;
}

export interface UpdateAppointmentData {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  appointment_date?: string;
  duration_minutes?: number;
  type?: 'visit' | 'quotation' | 'installation' | 'maintenance' | 'follow_up' | 'other';
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  title?: string;
  description?: string;
  location?: string;
  estimated_power?: number;
  estimated_value?: number;
  result?: 'sale_closed' | 'proposal_sent' | 'follow_up_needed' | 'lost' | 'pending';
  notes?: string;
}
