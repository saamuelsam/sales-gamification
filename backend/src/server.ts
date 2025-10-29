import app from './app';
import { verifyConnection } from './config/database';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Aguardar conexão com PostgreSQL (com retry)
    await verifyConnection();

    // Iniciar servidor
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
