import app from './app';
import { verifyConnection } from './config/database';
import { verifyDatabaseSchema } from './utils/schemaCheck'; // ✅ Import do verificador

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // 🔹 1️⃣ Garantir conexão com o PostgreSQL
    await verifyConnection();

    // 🔹 2️⃣ Validar integridade do schema
    console.log('\n🧩 Verificando estrutura do banco antes de iniciar o servidor...\n');
    await verifyDatabaseSchema();

    // 🔹 3️⃣ Se tudo estiver ok, iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
  