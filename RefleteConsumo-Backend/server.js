import express from 'express';
import pkg from 'mongodb';
const { MongoClient } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Carregar as variáveis de ambiente
dotenv.config();

// 2. Forçar o Node.js a usar o DNS do Google
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!uri) {
  console.error('Erro: MONGODB_URI não está definido no ficheiro .env');
  process.exit(1);
}
if (!jwtSecret) {
  console.error('Erro: JWT_SECRET não está definido no ficheiro .env');
  process.exit(1);
}

// 3. Inicializar a aplicação Express
const app = express();
const port = 3000;

// Middlewares essenciais
app.use(cors()); 
app.use(express.json()); 

// Criar o cliente MongoDB
const client = new MongoClient(uri);

let devicesCollection;
let usersCollection;

// Middleware de Autenticação (Protege as rotas de desejos)
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verificado = jwt.verify(token, jwtSecret);
    req.utilizador = verificado; // Guarda os dados do utilizador (id, email) no pedido
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token inválido ou expirado.' });
  }
};

async function iniciarServidor() {
  try {
    // Ligar à base de dados antes de abrir as rotas
    await client.connect();
    console.log('✅ Ligado ao MongoDB Atlas com sucesso!');

    // Selecionar a base de dados e as coleções
    const database = client.db('refleteconsumo');
    devicesCollection = database.collection('desejos');
    usersCollection = database.collection('utilizadores');

    // ========================================================
    // ROTAS DE AUTENTICAÇÃO
    // ========================================================

    // Rota de Registo de Utilizador
    app.post('/api/registo', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Preenche todos os campos.' });
        }

        const utilizadorExistente = await usersCollection.findOne({ email });
        if (utilizadorExistente) {
          return res.status(400).json({ error: 'Este email já está registado.' });
        }

        // Encriptar a password
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        const novoUtilizador = {
          email: email.toLowerCase(),
          password: passwordEncriptada,
          dataRegisto: new Date()
        };

        await usersCollection.insertOne(novoUtilizador);
        console.log(`👤 Novo utilizador registado: ${email}`);
        res.status(201).json({ message: 'Utilizador registado com sucesso!' });
      } catch (error) {
        console.error('Erro no registo:', error);
        res.status(500).json({ error: 'Erro ao registar utilizador.' });
      }
    });

    // Rota de Login
    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        const utilizador = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!utilizador) {
          return res.status(400).json({ error: 'Email ou password incorretos.' });
        }

        const passwordCorreta = await bcrypt.compare(password, utilizador.password);
        if (!passwordCorreta) {
          return res.status(400).json({ error: 'Email ou password incorretos.' });
        }

        // Criar o Token com o ID do utilizador
        const token = jwt.sign(
          { id: utilizador._id.toString(), email: utilizador.email },
          jwtSecret,
          { expiresIn: '7d' }
        );

        console.log(`🔑 Login efetuado por: ${email}`);
        res.status(200).json({ message: 'Login com sucesso!', token });
      } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
      }
    });

    // ========================================================
    // ROTAS DE DESEJOS (PROTEGIDAS POR TOKEN)
    // ========================================================

    app.get('/', (req, res) => {
      res.send('O backend do RefleteConsumo está a correr perfeitamente!');
    });

    // 1. ROTA GET - Busca APENAS os desejos do utilizador logado
    app.get('/api/desejos', verificarToken, async (req, res) => {
      try {
        // Filtra os desejos pelo ID do utilizador que vem no Token
        const desejos = await devicesCollection.find({ utilizadorId: req.utilizador.id }).toArray();
        res.status(200).json(desejos);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao buscar dados na base de dados.' });
      }
    });

    // 2. ROTA POST - Insere um desejo associado ao utilizador logado
    app.post('/api/desejos', verificarToken, async (req, res) => {
      console.log(`🚨 NOVO DESEJO SOLICITADO PELO UTILIZADOR: ${req.utilizador.email}`);

      try {
        const novoDesejo = {
          nome: req.body.nome,
          preco: req.body.preco,
          utilizadorId: req.utilizador.id, // <--- Relacionamento criado aqui!
          dataRegisto: new Date(),
          status: 'em_reflexao'
        }; 

        const resultado = await devicesCollection.insertOne(novoDesejo); 
        console.log("✅ Guardado no MongoDB com sucesso!");
        
        res.status(201).json({ 
          message: 'Desejo inserido com sucesso!', 
          _id: resultado.insertedId, 
          ...novoDesejo 
        });
      } catch (erro) {
        console.error('❌ Erro ao inserir no MongoDB:', erro);
        res.status(500).json({ error: 'Erro ao inserir na base de dados.' });
      }
    });

    // LIGAR O SERVIDOR (Configurado em '0.0.0.0' para aceitar conexões locais do telemóvel)
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor à escuta em http://localhost:${port}`);
    });

  } catch (error) {
    console.error('❌ Erro crítico ao iniciar a aplicação:', error);
  }
}

iniciarServidor();