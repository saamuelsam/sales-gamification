#!/bin/bash
# ==============================================================
# 🚀 MIGRATE_ALL.SH — Executa todas as migrações, seeds e patch
# ==============================================================
# Autor: Sam
# Projeto: Sales Gamification
# ==============================================================

DB_CONTAINER="sales_postgres"
DB_NAME="sales_gamification"
DB_USER="admin"

echo "🟢 Iniciando processo de migração completa..."
sleep 1

MIGRATIONS_PATH="../src/database/migrations"
SEEDS_PATH="../src/database/seeds"


# Verifica se as pastas existem
if [ ! -d "$MIGRATIONS_PATH" ]; then
  echo "❌ Pasta de migrações não encontrada em: $MIGRATIONS_PATH"
  exit 1
fi

echo "📦 Rodando migrações..."
for file in $(ls $MIGRATIONS_PATH/*.sql 2>/dev/null | sort); do
  echo "  → Executando $file"
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $file
done

# Patch opcional
PATCH_FILE="$MIGRATIONS_PATH/patch_users_table.sql"
if [ -f "$PATCH_FILE" ]; then
  echo "🧩 Aplicando patch na tabela users..."
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $PATCH_FILE
fi

# Seeds (se existir)
if [ -d "$SEEDS_PATH" ]; then
  echo "🌱 Inserindo dados iniciais (seeds)..."
  for file in $(ls $SEEDS_PATH/*.sql 2>/dev/null | sort); do
    echo "  → Executando $file"
    docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $file
  done
else
  echo "⚠️ Nenhuma pasta de seeds encontrada (opcional)."
fi

echo "✅ Migração completa!"
echo "-----------------------------------------------"
echo "Banco de dados pronto em: $DB_NAME"
echo "Container: $DB_CONTAINER"
echo "-----------------------------------------------"
