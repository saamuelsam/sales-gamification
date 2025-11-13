-- Migration: Create system_settings table
-- Description: Store system configuration key-value pairs

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default values
INSERT INTO system_settings (key, value) VALUES
  ('points_per_kilowatt', '1'),
  ('basket_reward_threshold', '400'),
  ('basket_reward_enabled', 'true'),
  ('goal_monthly_revenue', '100000'),
  ('goal_quarterly_revenue', '300000'),
  ('goal_annual_revenue', '1200000'),
  ('network_commission_line_1', '2'),
  ('network_commission_line_2', '1.5'),
  ('network_commission_line_3', '1'),
  ('notifications_enabled', 'true'),
  ('email_notifications', 'true'),
  ('notification_sale_approved', 'true'),
  ('notification_level_up', 'true'),
  ('notification_reward_earned', 'true'),
  ('maintenance_mode', 'false'),
  ('allow_new_registrations', 'true'),
  ('max_team_size', '100')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE system_settings IS 'System configuration settings stored as key-value pairs';
COMMENT ON COLUMN system_settings.key IS 'Configuration key identifier';
COMMENT ON COLUMN system_settings.value IS 'Configuration value as text';
COMMENT ON COLUMN system_settings.updated_at IS 'Last update timestamp';
