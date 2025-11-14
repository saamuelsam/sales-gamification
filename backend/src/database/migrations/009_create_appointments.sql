-- Migration: Criar tabela de agendamentos
-- Data: 2025-11-13

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informações do cliente
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    client_address TEXT,
    
    -- Dados do agendamento
    appointment_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    type VARCHAR(50) NOT NULL CHECK (type IN ('visit', 'quotation', 'installation', 'maintenance', 'follow_up', 'other')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    
    -- Detalhes
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,
    
    -- Estimativas e resultados
    estimated_power NUMERIC(10,2), -- kW estimado
    estimated_value NUMERIC(12,2), -- valor estimado da venda
    
    -- Resultado após visita
    result VARCHAR(50) CHECK (result IN ('sale_closed', 'proposal_sent', 'follow_up_needed', 'lost', 'pending')),
    notes TEXT,
    
    -- Lembretes e notificações
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(type);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Comentários
COMMENT ON TABLE appointments IS 'Agendamentos de visitas, cotações e instalações';
COMMENT ON COLUMN appointments.type IS 'Tipos: visit (visita), quotation (cotação), installation (instalação), maintenance (manutenção), follow_up (acompanhamento), other (outro)';
COMMENT ON COLUMN appointments.status IS 'Status: scheduled (agendado), confirmed (confirmado), in_progress (em andamento), completed (concluído), cancelled (cancelado), rescheduled (reagendado)';
COMMENT ON COLUMN appointments.result IS 'Resultado: sale_closed (venda fechada), proposal_sent (proposta enviada), follow_up_needed (precisa acompanhamento), lost (perdido), pending (pendente)';
