import express from 'express';
import pkg from 'mongodb';
const { MongoClient } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';

// 1. Carregar as variáveis de ambiente
dotenv.config();

// 2. Forçar o Node.js a usar o DNS do Google (ajuda a evitar bloqueios na rede local)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Erro: MONGODB_URI não está definido no ficheiro .env');
  process.exit(1);
}

// 3. Inicializar a aplicação Express
const app = express();
const port = 3000;

// Middlewares essenciais
app.use(cors()); // Permite que a tua app mobile consiga comunicar com o servidor
app.use(express.json()); // Permite que o servidor consiga ler a informação que envias no formato JSON

// Criar o cliente MongoDB
const client = new MongoClient(uri);

let devicesCollection;

async function iniciarServidor() {
  try {
    // Ligar à base de dados antes de abrir as rotas
    await client.connect();
    console.log('✅ Ligado ao MongoDB Atlas com sucesso!');

    // Selecionar a base de dados e a coleção correta
    const database = client.db('refleteconsumo');
    devicesCollection = database.collection('desejos');

// Rota Base
    app.get('/', (req, res) => {
      res.send('O backend do RefleteConsumo está a correr perfeitamente!');
    });

    // 1. ROTA GET - MUDAR DE '/api/devices' PARA '/api/desejos'
    app.get('/api/desejos', async (req, res) => {
      try {
        const devices = await devicesCollection.find({}).toArray();
        res.status(200).json(devices);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao buscar dados na base de dados.' });
      }
    });

    // 2. ROTA POST 
    app.post('/api/desejos', async (req, res) => {
      console.log("🚨 CHEGOU UM PEDIDO DO TELEMÓVEL!"); // <--- ADICIONA ISTO
      console.log("Dados recebidos:", req.body);        // <--- ADICIONA ISTO

      try {
        const novoDispositivo = {
          nome: req.body.nome,
          preco: req.body.preco,
          dataRegisto: new Date(),
          status: 'em_reflexao'
        }; 

        const resultado = await devicesCollection.insertOne(novoDispositivo); 
        console.log("✅ Guardado no MongoDB com sucesso!", resultado); // <--- ADICIONA ISTO
        
        res.status(201).json({ 
          message: 'Desejo inserido com sucesso!', 
          _id: resultado.insertedId, 
          ...novoDispositivo 
        });
      } catch (erro) {
        console.error('❌ Erro ao inserir no MongoDB:', erro); // <--- ADICIONA ISTO
        res.status(500).json({ error: 'Erro ao inserir na base de dados.' });
      }
    });
    // ========================================================
    // LIGAR O SERVIDOR
    // ========================================================
    app.listen(port, () => {
      console.log(`🚀 Servidor à escuta em http://localhost:${port}`);
    });

  } catch (error) {
    console.error('❌ Erro crítico ao iniciar a aplicação:', error);
  }
}

iniciarServidor();
