"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 4000;
const startServer = async () => {
    try {
        // Aguardar conexão com PostgreSQL (com retry)
        await (0, database_1.verifyConnection)();
        // Iniciar servidor
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
