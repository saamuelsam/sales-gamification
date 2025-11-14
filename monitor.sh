#!/bin/bash
#######################################
# Script de Monitoramento do Sistema
# Executar via cron: */5 * * * * /root/sales-gamification/monitor.sh
#######################################

LOG_FILE="/root/sales-gamification/logs/monitor.log"
ALERT_EMAIL="admin@sesfortal.com.br"  # Configure seu email
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEM=80
ALERT_THRESHOLD_DISK=85

mkdir -p "$(dirname $LOG_FILE)"

echo "========================================" >> "$LOG_FILE"
echo "📊 Monitoramento - $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Função para enviar alerta
send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
}

# Verificar containers rodando
echo "🐳 Status dos Containers:" >> "$LOG_FILE"
docker-compose ps >> "$LOG_FILE" 2>&1

# Verificar se todos os containers estão UP
CONTAINERS_DOWN=$(docker-compose ps | grep -c "Exit\|Down")
if [ $CONTAINERS_DOWN -gt 0 ]; then
    ALERT_MSG="⚠️ ALERTA: $CONTAINERS_DOWN container(s) fora do ar!"
    echo "$ALERT_MSG" >> "$LOG_FILE"
    send_alert "🚨 Sales Gamification - Container Down" "$ALERT_MSG"
fi

# Uso de CPU dos containers
echo "" >> "$LOG_FILE"
echo "💻 Uso de CPU/Memória:" >> "$LOG_FILE"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}" >> "$LOG_FILE"

# Verificar uso de CPU
CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" sales_backend | tr -d '%' | cut -d. -f1)
if [ "$CPU_USAGE" -gt "$ALERT_THRESHOLD_CPU" ]; then
    ALERT_MSG="⚠️ ALERTA: CPU do backend em ${CPU_USAGE}% (limite: ${ALERT_THRESHOLD_CPU}%)"
    echo "$ALERT_MSG" >> "$LOG_FILE"
    send_alert "🚨 Sales Gamification - CPU Alto" "$ALERT_MSG"
fi

# Verificar uso de memória
MEM_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" sales_backend | tr -d '%' | cut -d. -f1)
if [ "$MEM_USAGE" -gt "$ALERT_THRESHOLD_MEM" ]; then
    ALERT_MSG="⚠️ ALERTA: Memória do backend em ${MEM_USAGE}% (limite: ${ALERT_THRESHOLD_MEM}%)"
    echo "$ALERT_MSG" >> "$LOG_FILE"
    send_alert "🚨 Sales Gamification - Memória Alta" "$ALERT_MSG"
fi

# Verificar uso de disco
echo "" >> "$LOG_FILE"
echo "💾 Uso de Disco:" >> "$LOG_FILE"
df -h / >> "$LOG_FILE"

DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
    ALERT_MSG="⚠️ ALERTA: Disco em ${DISK_USAGE}% (limite: ${ALERT_THRESHOLD_DISK}%)"
    echo "$ALERT_MSG" >> "$LOG_FILE"
    send_alert "🚨 Sales Gamification - Disco Cheio" "$ALERT_MSG"
fi

# Verificar logs de erro recentes
echo "" >> "$LOG_FILE"
echo "❌ Erros Recentes (últimas 10 linhas):" >> "$LOG_FILE"
docker-compose logs --tail=100 backend 2>&1 | grep -i "error\|fatal\|exception" | tail -10 >> "$LOG_FILE"

# Verificar se API está respondendo
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health)
if [ "$HEALTH_CHECK" != "200" ]; then
    ALERT_MSG="⚠️ ALERTA: API não está respondendo! Status: $HEALTH_CHECK"
    echo "$ALERT_MSG" >> "$LOG_FILE"
    send_alert "🚨 Sales Gamification - API Down" "$ALERT_MSG"
else
    echo "✅ API respondendo normalmente (Status: 200)" >> "$LOG_FILE"
fi

# Verificar conexões do PostgreSQL
echo "" >> "$LOG_FILE"
echo "🗄️  Conexões PostgreSQL:" >> "$LOG_FILE"
docker exec sales_postgres psql -U admin -d sales_gamification -c "SELECT count(*) as connections FROM pg_stat_activity;" >> "$LOG_FILE" 2>&1

# Limpar logs antigos (manter últimos 30 dias)
find "$(dirname $LOG_FILE)" -name "monitor.log.*" -mtime +30 -delete

echo "" >> "$LOG_FILE"
echo "✅ Monitoramento concluído" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Rotacionar log se ficar muito grande (> 10MB)
LOG_SIZE=$(du -m "$LOG_FILE" | cut -f1)
if [ "$LOG_SIZE" -gt 10 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d)"
    gzip "${LOG_FILE}.$(date +%Y%m%d)"
    echo "Log rotacionado: ${LOG_FILE}.$(date +%Y%m%d).gz"
fi
