import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'mongodb';
import { getCollection } from '../db.js';

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Erro: JWT_SECRET não está definido no ficheiro .env');
  process.exit(1);
}

// Middleware de Autenticação (Protege as rotas de desejos e perfil)
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

// ========================================================
// ROTAS DE AUTENTICAÇÃO E PERFIL
// ========================================================

// Rota de Registo Completo
router.post('/registo', async (req, res) => {
  try {
    const { nome, email, password, genero, isFumador } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Preenche os campos obrigatórios (email e password).' });
    }

    const usersCollection = getCollection('utilizadores');
    const utilizadorExistente = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (utilizadorExistente) {
      return res.status(400).json({ error: 'Este email já está registado.' });
    }

    // Encriptar a password
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const novoUtilizador = { 
      nome, 
      email: email.toLowerCase(), 
      password: passwordEncriptada, 
      genero, 
      isFumador, 
      dataRegisto: new Date() 
    };

    await usersCollection.insertOne(novoUtilizador);
    console.log(`👤 Novo utilizador registado: ${email}`);
    res.status(201).json({ message: 'Registo completo!' });
  } catch (error) { 
    console.error('Erro no registo:', error);
    res.status(500).json({ error: 'Erro no registo.' }); 
  }
});

// Rota de Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersCollection = getCollection('utilizadores');

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

// Rota de Perfil (Busca TUDO)
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usersCollection = getCollection('utilizadores');
    const user = await usersCollection.findOne({ _id: new pkg.ObjectId(req.utilizador.id) }, { projection: { password: 0 } });
    res.json(user);
  } catch (error) { 
    res.status(500).json({ error: 'Erro ao buscar perfil.' }); 
  }
});

// Rota de Update (Edita TUDO)
router.put('/update-perfil', verificarToken, async (req, res) => {
  try {
    const { nome, email, genero, isFumador } = req.body;
    const usersCollection = getCollection('utilizadores');
    await usersCollection.updateOne({ _id: new pkg.ObjectId(req.utilizador.id) }, { $set: { nome, email, genero, isFumador } });
    res.json({ message: 'Perfil editado!' });
  } catch (error) { 
    res.status(500).json({ error: 'Erro ao editar.' }); 
  }
});

// Rota para Atualizar a Password
router.post('/update-password', verificarToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const usersCollection = getCollection('utilizadores');

    const utilizador = await usersCollection.findOne({ _id: new pkg.ObjectId(req.utilizador.id) });
    if (!utilizador) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const passwordCorreta = await bcrypt.compare(oldPassword, utilizador.password);
    if (!passwordCorreta) {
      return res.status(400).json({ error: 'A password antiga está incorreta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const novaPasswordEncriptada = await bcrypt.hash(newPassword, salt);

    await usersCollection.updateOne(
      { _id: new pkg.ObjectId(req.utilizador.id) },
      { $set: { password: novaPasswordEncriptada } }
    );

    res.json({ message: 'Password atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar password:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar password.' });
  }
});

// ========================================================
// ROTAS DE DESEJOS E GASTOS
// ========================================================

// 1. ROTA GET - Listagem de Desejos
router.get('/desejos', verificarToken, async (req, res) => {
  try {
    const devicesCollection = getCollection('desejos');
    const desejos = await devicesCollection.find({ utilizadorId: req.utilizador.id }).toArray();
    res.json(desejos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar desejos.' });
  }
});

// 2. ROTA POST - Inserção de Desejo (Alta precisão com data e hora do seletor de rodas)
router.post('/desejos', verificarToken, async (req, res) => {
  try {
    const { nome, preco, categoria, diasCooldown, dataLiberacao: dataEnviada } = req.body;
    
    let dataLiberacao = dataEnviada ? new Date(dataEnviada) : new Date();
    if (!dataEnviada) {
      dataLiberacao.setDate(dataLiberacao.getDate() + parseInt(diasCooldown || 0));
    }

    const devicesCollection = getCollection('desejos');
    const novoDesejo = {
      nome, 
      preco, 
      categoria,
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
router.post('/desejos/decidir', verificarToken, async (req, res) => {
  try {
    const { desejoId, comprar } = req.body;
    const status = comprar ? 'comprado' : 'descartado';
    
    const devicesCollection = getCollection('desejos');
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
router.get('/gastos', verificarToken, async (req, res) => {
  try {
    const devicesCollection = getCollection('desejos');
    const gastos = await devicesCollection.find({ 
      utilizadorId: req.utilizador.id, 
      status: 'comprado' 
    }).toArray();
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos.' });
  }
});

export default router;