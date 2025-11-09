"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/database/migrate.ts
const database_1 = require("../config/database");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const runMigrations = async () => {
    console.log('🔹 DB_HOST configurado:', process.env.DB_HOST); // Log para debugs
    console.log('🔹 Host atual no pool:', database_1.pool.options.host);
    const client = await database_1.pool.connect();
    try {
        console.log('🚀 Executando migrations...\n');
        // Habilitar extensão ltree para hierarquia
        await client.query('CREATE EXTENSION IF NOT EXISTS ltree;');
        console.log('✅ Extensão ltree habilitada\n');
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('⚠️  Pasta de migrations não encontrada');
            return;
        }
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
            console.log(`   Executando: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            await client.query(sql);
            console.log(`   ✅ ${file} concluído\n`);
        }
        console.log('✅ Todas as migrations foram executadas com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao executar migrations:', error);
        throw error;
    }
    finally {
        client.release();
        await database_1.pool.end();
    }
};
runMigrations();
