"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const schemaCheck_1 = require("./utils/schemaCheck"); // ✅ Import do verificador
const PORT = process.env.PORT || 4000;
const startServer = async () => {
    try {
        // 🔹 1️⃣ Garantir conexão com o PostgreSQL
        await (0, database_1.verifyConnection)();
        // 🔹 2️⃣ Validar integridade do schema
        console.log('\n🧩 Verificando estrutura do banco antes de iniciar o servidor...\n');
        await (0, schemaCheck_1.verifyDatabaseSchema)();
        // 🔹 3️⃣ Se tudo estiver ok, iniciar servidor
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};
startServer();
