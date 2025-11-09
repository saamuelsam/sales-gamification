CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  action VARCHAR(20), -- 'login' ou 'logout'
  created_at TIMESTAMP DEFAULT NOW()
);
