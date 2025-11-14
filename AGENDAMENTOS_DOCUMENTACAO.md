# Sistema de Agendamentos - Documentação

## 📅 Visão Geral

Sistema completo de agendamentos para consultores gerenciarem visitas, cotações e instalações de painéis solares.

## ✅ Funcionalidades Implementadas

### Backend

#### 1. Migração de Banco de Dados
- **Arquivo:** `backend/src/database/migrations/009_create_appointments.sql`
- **Tabela:** `appointments`
- **Campos principais:**
  - Informações do cliente (nome, telefone, email, endereço)
  - Data e hora do agendamento
  - Duração em minutos
  - Tipo de agendamento (visita, cotação, instalação, manutenção, follow-up, outro)
  - Status (agendado, confirmado, em andamento, concluído, cancelado, reagendado)
  - Estimativas (potência em kW, valor em R$)
  - Resultado do agendamento
  - Campos de auditoria (created_at, updated_at, completed_at, cancelled_at)

#### 2. Service Layer
- **Arquivo:** `backend/src/modules/appointments/appointment.service.ts`
- **Métodos:**
  - `createAppointment()` - Criar novo agendamento
  - `getUserAppointments()` - Listar com filtros (status, tipo, data)
  - `getAppointmentById()` - Buscar por ID
  - `updateAppointment()` - Atualizar dados
  - `cancelAppointment()` - Cancelar com motivo
  - `completeAppointment()` - Concluir com resultado
  - `getTodayAppointments()` - Agendamentos do dia
  - `getWeekAppointments()` - Agendamentos da semana
  - `getAppointmentStats()` - Estatísticas
  - `deleteAppointment()` - Deletar

#### 3. Controller
- **Arquivo:** `backend/src/modules/appointments/appointment.controller.ts`
- Todos os endpoints com tratamento de erros e validações

#### 4. Rotas
- **Arquivo:** `backend/src/modules/appointments/appointment.routes.ts`
- **Endpoints:**
  ```
  GET    /api/appointments         - Listar agendamentos
  GET    /api/appointments/today   - Agendamentos de hoje
  GET    /api/appointments/week    - Agendamentos da semana
  GET    /api/appointments/stats   - Estatísticas
  GET    /api/appointments/:id     - Buscar por ID
  POST   /api/appointments         - Criar agendamento
  PUT    /api/appointments/:id     - Atualizar agendamento
  DELETE /api/appointments/:id     - Deletar agendamento
  POST   /api/appointments/:id/cancel   - Cancelar
  POST   /api/appointments/:id/complete - Concluir
  ```

### Frontend

#### 1. Types
- **Arquivo:** `frontend/src/types/appointment.ts`
- Interfaces TypeScript para Appointment, AppointmentStats, CreateAppointmentData, UpdateAppointmentData

#### 2. Service
- **Arquivo:** `frontend/src/services/appointmentService.ts`
- Integração com API usando Axios
- Métodos para todas as operações CRUD

#### 3. Página Principal
- **Arquivo:** `frontend/src/features/appointments/pages/AppointmentsPage.tsx`
- Dashboard com estatísticas
- Filtros por status e tipo
- Botão para criar novo agendamento
- Lista de agendamentos

#### 4. Formulário de Criação
- **Arquivo:** `frontend/src/features/appointments/components/AppointmentForm.tsx`
- Formulário completo com todos os campos
- Validação de campos obrigatórios
- Data e hora com datetime-local
- Tipo de agendamento
- Estimativas de potência e valor

#### 5. Lista de Agendamentos
- **Arquivo:** `frontend/src/features/appointments/components/AppointmentList.tsx`
- Cartões com informações detalhadas
- Badges coloridos para status
- Botões de ação:
  - Confirmar agendamento
  - Iniciar atendimento
  - Concluir (com seleção de resultado)
  - Cancelar (com motivo)
  - Deletar
- Formatação de datas com date-fns

#### 6. Navegação
- Menu "Agendamentos" no sidebar
- Rota `/appointments`
- Ícone de calendário

## 🎨 UI/UX

### Cores por Status
- **Agendado:** Azul
- **Confirmado:** Verde
- **Em Andamento:** Amarelo
- **Concluído:** Cinza
- **Cancelado:** Vermelho
- **Reagendado:** Roxo

### Estatísticas
- Agendados
- Confirmados
- Concluídos
- Vendas Fechadas
- Cancelados

### Tipos de Agendamento
- 📍 Visita
- 💰 Cotação
- 🔧 Instalação
- 🛠️ Manutenção
- 📞 Follow-up
- 📋 Outro

### Resultados Possíveis
- Venda Fechada
- Proposta Enviada
- Necessita Follow-up
- Perdido
- Pendente

## 🔒 Segurança

- Todas as rotas protegidas com autenticação JWT
- Usuários só podem acessar seus próprios agendamentos
- Validação de userId em todas as operações

## 📊 Banco de Dados

### Índices para Performance
```sql
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_type ON appointments(type);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX idx_appointments_result ON appointments(result);
```

### Trigger para Updated_at
Atualiza automaticamente o campo `updated_at` em toda modificação

## 🧪 Testes Realizados

### Backend
✅ POST /api/appointments - Criar agendamento
✅ GET /api/appointments - Listar agendamentos
✅ GET /api/appointments/stats - Estatísticas

### Dados de Teste
- Cliente: João Silva
- Telefone: 11987654321
- Email: joao@example.com
- Tipo: Cotação
- Data: 30/01/2025 10:00
- Título: Cotação residencial 10kW

## 📦 Dependências Adicionadas

### Backend
- Nenhuma (usa dependências existentes)

### Frontend
- `date-fns` - Formatação de datas

## 🚀 Como Usar

### 1. Criar Agendamento
1. Acessar menu "Agendamentos"
2. Clicar em "+ Novo Agendamento"
3. Preencher dados do cliente
4. Definir data/hora e tipo
5. Salvar

### 2. Gerenciar Agendamentos
- **Confirmar:** Mudar status de "Agendado" para "Confirmado"
- **Iniciar:** Mudar para "Em Andamento"
- **Concluir:** Selecionar resultado e adicionar observações
- **Cancelar:** Informar motivo do cancelamento

### 3. Filtrar
- Por status (agendado, confirmado, etc.)
- Por tipo (visita, cotação, instalação, etc.)

## 📱 Responsividade

- Layout adaptado para desktop e mobile
- Grid responsivo para estatísticas
- Formulário com campos organizados em grid

## 🎯 Próximas Melhorias (Opcionais)

- [ ] Visualização em calendário
- [ ] Notificações/lembretes antes dos agendamentos
- [ ] Integração com Google Calendar
- [ ] Exportar agendamentos para PDF
- [ ] Dashboard com mapa de visitas
- [ ] Sincronização automática ao concluir com venda
- [ ] Repetir agendamentos (recorrência)

## 📝 Observações

- Sistema totalmente funcional e testado
- Backend rodando na porta 4000
- Frontend rodando na porta 5174
- PostgreSQL com migração aplicada
- Dark mode suportado em todos os componentes
