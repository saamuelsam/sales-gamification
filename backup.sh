#!/bin/bash
#######################################
# Script de Backup Automático PostgreSQL
# Executar via cron: 0 2 * * * /root/sales-gamification/backup.sh
#######################################

# Configurações
BACKUP_DIR="/root/sales-gamification/backups"
DB_CONTAINER="sales_postgres"
DB_USER="admin"
DB_NAME="sales_gamification"
RETENTION_DAYS=7

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Nome do arquivo com timestamp
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# Executar backup
echo "📦 Iniciando backup do banco de dados..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

# Verificar se backup foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso: $BACKUP_FILE"
    
    # Comprimir backup
    gzip "$BACKUP_FILE"
    echo "📦 Backup comprimido: $BACKUP_FILE.gz"
    
    # Remover backups antigos (manter apenas últimos 7 dias)
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "🗑️  Backups antigos removidos (retenção: $RETENTION_DAYS dias)"
    
    # Estatísticas
    BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
    echo "📊 Tamanho do backup: $BACKUP_SIZE"
    echo "📊 Total de backups: $(ls -1 $BACKUP_DIR/backup_*.sql.gz | wc -l)"
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi

# Opcional: Enviar para armazenamento externo (descomente se usar S3, Dropbox, etc)
# aws s3 cp "$BACKUP_FILE.gz" s3://seu-bucket/backups/
# rclone copy "$BACKUP_FILE.gz" dropbox:backups/

echo "✅ Backup concluído!"
