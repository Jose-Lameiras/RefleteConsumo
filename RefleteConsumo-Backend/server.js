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

          // Rota de Registo Completa
      app.post('/api/registo', async (req, res) => {
        try {
          const { nome, email, password, genero, isFumador } = req.body;
          const utilizadorExistente = await usersCollection.findOne({ email });
          if (utilizadorExistente) return res.status(400).json({ error: 'Email já existe.' });

          const passwordEncriptada = await bcrypt.hash(password, 10);
          const novoUtilizador = { 
            nome, email: email.toLowerCase(), password: passwordEncriptada, 
            genero, isFumador, dataRegisto: new Date() 
          };
          await usersCollection.insertOne(novoUtilizador);
          res.status(201).json({ message: 'Registo completo!' });
        } catch (error) { res.status(500).json({ error: 'Erro no registo.' }); }
      });

    // Rota de Perfil (Busca TUDO)
    app.get('/api/perfil', verificarToken, async (req, res) => {
      try {
        const user = await usersCollection.findOne({ _id: new pkg.ObjectId(req.utilizador.id) }, { projection: { password: 0 } });
        res.json(user);
      } catch (error) { res.status(500).json({ error: 'Erro ao buscar perfil.' }); }
    });

    // Rota de Update (Edita TUDO)
    app.put('/api/update-perfil', verificarToken, async (req, res) => {
      try {
        const { nome, email, genero, isFumador } = req.body;
        await usersCollection.updateOne({ _id: new pkg.ObjectId(req.utilizador.id) }, { $set: { nome, email, genero, isFumador } });
        res.json({ message: 'Perfil editado!' });
      } catch (error) { res.status(500).json({ error: 'Erro ao editar.' }); }
    });

    // ========================================================
    // ROTAS DE DESEJOS E GASTOS
    // ========================================================

// ========================================================
    // ROTAS DE DESEJOS E GASTOS (VERSÃO CORRIGIDA)
    // ========================================================

    // 1. ROTA GET - Listagem de Desejos
    app.get('/api/desejos', verificarToken, async (req, res) => {
      try {
        const desejos = await devicesCollection.find({ utilizadorId: req.utilizador.id }).toArray();
        res.json(desejos);
      } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar desejos.' });
      }
    });

    // 2. ROTA POST - Inserção de Desejo
    app.post('/api/desejos', verificarToken, async (req, res) => {
      try {
        const { nome, preco, categoria, diasCooldown } = req.body;
        const dataLiberacao = new Date();
        dataLiberacao.setDate(dataLiberacao.getDate() + parseInt(diasCooldown || 0));

        const novoDesejo = {
          nome, preco, categoria,
          utilizadorId: req.utilizador.id,
          dataRegisto: new Date(),
          dataLiberacao,
          status: 'em_reflexao'
        };
        await devicesCollection.insertOne(novoDesejo);
        res.status(201).json(novoDesejo);
      } catch (error) {
        res.status(500).json({ error: 'Erro ao criar desejo.' });
      }
    });

    // 3. ROTA POST - Decisão (Conversão para Gasto)
    app.post('/api/desejos/decidir', verificarToken, async (req, res) => {
      try {
        const { desejoId, comprar } = req.body;
        const status = comprar ? 'comprado' : 'descartado';
        await devicesCollection.updateOne(
          { _id: new pkg.ObjectId(desejoId), utilizadorId: req.utilizador.id },
          { $set: { status } }
        );
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Erro ao processar decisão.' });
      }
    });

    // 4. ROTA GET - Listagem de Gastos
    app.get('/api/gastos', verificarToken, async (req, res) => {
      try {
        const gastos = await devicesCollection.find({ 
          utilizadorId: req.utilizador.id, 
          status: 'comprado' 
        }).toArray();
        res.json(gastos);
      } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar gastos.' });
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