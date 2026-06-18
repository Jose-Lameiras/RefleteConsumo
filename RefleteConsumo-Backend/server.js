import express from 'express';
import cors from 'cors';
import dns from 'dns';
import dotenv from 'dotenv';
import { connectDB } from './src/db.js';
import apiRoutes from './src/routes/routes.js';

// Carregar as variáveis de ambiente
dotenv.config();

// Forçar o Node.js a usar o DNS do Google
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const port = 3000;

// Middlewares essenciais
app.use(cors()); 
app.use(express.json()); 

// Vincular todas as rotas ao prefixo /api (mantendo a compatibilidade com a app)
app.use('/api', apiRoutes);

async function iniciarServidor() {
  try {
    // Ligar à base de dados antes de abrir o servidor
    await connectDB();

    // LIGAR O SERVIDOR (Configurado em '0.0.0.0' para aceitar conexões locais do telemóvel)
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor à escuta em http://localhost:${port}`);
    });

  } catch (error) {
    console.error('❌ Erro crítico ao iniciar a aplicação:', error);
  }
}

iniciarServidor();