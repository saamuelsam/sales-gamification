#!/bin/bash
# ==============================================================
# 🚀 MIGRATE_ALL.SH — Executa todas as migrações, seeds e patch
# ==============================================================
# Autor: Sam
# Projeto: Sales Gamification
# Descrição:
#   Este script executa todas as migrações SQL, insere seeds e
#   aplica patches para garantir que o banco esteja completo.
# ==============================================================

# Configurações
DB_CONTAINER="sales_postgres"
DB_NAME="sales_gamification"
DB_USER="admin"

echo "🟢 Iniciando processo de migração completa..."
sleep 1

# Executar todas as migrações (em ordem)
echo "📦 Rodando migrações..."
for file in $(ls src/database/migrations/*.sql | sort); do
  echo "  → Executando $file"
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $file
done

# Aplicar patch na tabela users
if [ -f "src/database/migrations/patch_users_table.sql" ]; then
  echo "🧩 Aplicando patch na tabela users..."
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < src/database/migrations/patch_users_table.sql
fi

# Executar seeds
echo "🌱 Inserindo dados iniciais (seeds)..."
for file in $(ls src/database/seeds/*.sql | sort); do
  echo "  → Executando $file"
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $file
done

echo "✅ Migração completa!"
echo "-----------------------------------------------"
echo "Banco de dados pronto em: $DB_NAME"
echo "Container: $DB_CONTAINER"
echo "-----------------------------------------------"
