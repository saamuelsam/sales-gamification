"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDatabaseSchema = verifyDatabaseSchema;
const database_1 = require("../config/database");
const requiredSchema = [
    // 🔹 Usuários
    { table: 'users', column: 'id' },
    { table: 'users', column: 'email' },
    { table: 'users', column: 'password' },
    { table: 'users', column: 'role' },
    { table: 'users', column: 'points' },
    { table: 'users', column: 'is_active' },
    { table: 'users', column: 'path' },
    // 🔹 Vendas
    { table: 'sales', column: 'id' },
    { table: 'sales', column: 'user_id' },
    { table: 'sales', column: 'value' },
    { table: 'sales', column: 'kilowatts' },
    { table: 'sales', column: 'sale_type' },
    { table: 'sales', column: 'status' },
    // 🔹 Comissões
    { table: 'personal_commissions', column: 'user_id' },
    { table: 'personal_commissions', column: 'commission_amount' },
    { table: 'network_commissions', column: 'leader_id' },
    { table: 'network_commissions', column: 'commission_amount' },
    // 🔹 Pontos e níveis
    { table: 'points', column: 'points' },
    { table: 'levels', column: 'phase_number' },
    { table: 'levels', column: 'points_required' },
    { table: 'levels', column: 'personal_commission' },
    { table: 'levels', column: 'role' },
    // 🔹 Notificações e prêmios
    { table: 'notifications', column: 'user_id' },
    { table: 'rewards', column: 'user_id' },
];
async function verifyDatabaseSchema() {
    console.log('\n🧠 Verificando integridade do banco de dados...\n');
    const client = await database_1.pool.connect();
    try {
        let allGood = true;
        for (const { table, column } of requiredSchema) {
            const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
            if (result.rowCount === 0) {
                allGood = false;
                console.error(`❌ Faltando coluna '${column}' na tabela '${table}'`);
            }
            else {
                console.log(`✅ ${table}.${column}`);
            }
        }
        if (allGood) {
            console.log('\n✅ Banco de dados verificado com sucesso!\n');
        }
        else {
            console.error('\n🚨 Erros encontrados no schema. Corrija antes de iniciar o servidor.\n');
            process.exit(1);
        }
    }
    catch (err) {
        console.error('❌ Erro ao verificar o schema:', err);
        process.exit(1);
    }
    finally {
        client.release();
    }
}
