import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'mongodb';
import { getCollection } from '../db.js';
import { DAILY_TIPS_SEED } from '../data/daily-tips.seed.js';

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

const ensureDailyTipsSeeded = async () => {
  const tipsCollection = getCollection('daily_tips');
  const total = await tipsCollection.countDocuments({});

  // Se ja tiver pelo menos 31 dicas, nao faz nada.
  if (total >= DAILY_TIPS_SEED.length) {
    return;
  }

  const operations = DAILY_TIPS_SEED.map((tip) => ({
    updateOne: {
      filter: { dayOfMonth: tip.dayOfMonth },
      update: {
        $set: {
          texto: tip.texto,
          categoria: tip.categoria,
          dayOfMonth: tip.dayOfMonth,
          dataAtualizacao: new Date(),
        },
        $setOnInsert: {
          dataCriacao: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await tipsCollection.bulkWrite(operations);
};

// ========================================================
// ROTAS DE AUTENTICAÇÃO E PERFIL
// ========================================================

// Rota de Registo Completo
router.post('/registo', async (req, res) => {
  try {
    const { nome, email, password, genero, isFumador, salario } = req.body;

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
      salario: salario !== undefined ? parseFloat(salario) : null,
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
    res.status(200).json({ 
      message: 'Login com sucesso!', 
      token,
      isFumador: utilizador.isFumador || false
    });
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
    const { nome, email, genero, isFumador, salario } = req.body;
    const usersCollection = getCollection('utilizadores');
    await usersCollection.updateOne(
      { _id: new pkg.ObjectId(req.utilizador.id) },
      { $set: { nome, email, genero, isFumador, salario: salario !== undefined ? parseFloat(salario) : null } }
    );
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
    const { nome, preco, category, categoria, diasCooldown, dataLiberacao: dataEnviada } = req.body;
    const categoriaNormalizada = category || categoria;
    
    let dataLiberacao = dataEnviada ? new Date(dataEnviada) : new Date();
    if (!dataEnviada) {
      dataLiberacao.setDate(dataLiberacao.getDate() + parseInt(diasCooldown || 0));
    }

    const devicesCollection = getCollection('desejos');
    const novoDesejo = {
      nome, 
      preco, 
      categoria: categoriaNormalizada,
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

// ========================================================
// ROTAS DO SMOKE TRACKER (MONITORIZAÇÃO DE TABACO)
// ========================================================

// 1. ROTA POST - Registar um cigarro fumado
router.post('/smoke/registar', verificarToken, async (req, res) => {
  try {
    const { precoMaco, quantidadeNoMaco } = req.body;
    const precoPorCigarro = (parseFloat(precoMaco) || 0) / (parseInt(quantidadeNoMaco) || 20);

    const smokeCollection = getCollection('smoke_tracker');
    const novoRegisto = {
      utilizadorId: req.utilizador.id,
      dataHora: new Date(),
      custo: precoPorCigarro
    };

    await smokeCollection.insertOne(novoRegisto);
    res.status(201).json({ message: 'Cigarro registado!', registo: novoRegisto });
  } catch (error) {
    console.error('Erro ao registar fumo:', error);
    res.status(500).json({ error: 'Erro interno ao guardar no servidor.' });
  }
});

// 2. ROTA GET - Listar todo o histórico de fumo
router.get('/smoke/historico', verificarToken, async (req, res) => {
  try {
    const smokeCollection = getCollection('smoke_tracker');
    const historico = await smokeCollection
      .find({ utilizadorId: req.utilizador.id })
      .sort({ dataHora: -1 })
      .toArray();
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
});

// ========================================================
// ROTAS DO QUIZ (AUTORREFLEXÃO)
// ========================================================

// 1. ROTA POST - Guardar resultado do quiz
router.post('/quiz', verificarToken, async (req, res) => {
  try {
    const { score, perfil, respostas } = req.body;
    
    if (score === undefined || !perfil) {
      return res.status(400).json({ error: 'Score e perfil são obrigatórios.' });
    }

    const quizCollection = getCollection('quiz_results');
    const resultado = {
      utilizadorId: req.utilizador.id,
      score,
      perfil,
      respostas,
      dataRealizacao: new Date()
    };

    await quizCollection.insertOne(resultado);
    res.status(201).json({ message: 'Quiz guardado com sucesso!', resultado });
  } catch (error) {
    console.error('Erro ao guardar quiz:', error);
    res.status(500).json({ error: 'Erro ao guardar resultado do quiz.' });
  }
});

// 2. ROTA GET - Buscar último resultado do quiz
router.get('/quiz', verificarToken, async (req, res) => {
  try {
    const quizCollection = getCollection('quiz_results');
    const ultimoQuiz = await quizCollection
      .findOne({ utilizadorId: req.utilizador.id }, { sort: { dataRealizacao: -1 } });
    
    if (!ultimoQuiz) {
      return res.status(404).json({ error: 'Nenhum quiz realizado ainda.' });
    }

    res.json(ultimoQuiz);
  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    res.status(500).json({ error: 'Erro ao buscar resultado do quiz.' });
  }
});

// 3. ROTA GET - Histórico de todos os quizzes
router.get('/quiz/historico', verificarToken, async (req, res) => {
  try {
    const quizCollection = getCollection('quiz_results');
    const historico = await quizCollection
      .find({ utilizadorId: req.utilizador.id })
      .sort({ dataRealizacao: -1 })
      .toArray();
    
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico de quizzes:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de quizzes.' });
  }
});

// ========================================================
// ROTAS DE ORÇAMENTO E CONFIGURAÇÕES DO UTILIZADOR
// ========================================================

// 1. ROTA GET - Obter orçamento do utilizador
router.get('/user/budget', verificarToken, async (req, res) => {
  try {
    const settingsCollection = getCollection('user_settings');
    const settings = await settingsCollection.findOne({ utilizadorId: req.utilizador.id });
    res.json({ budget: settings?.budget || 0 });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamento.' });
  }
});

// 2. ROTA PUT - Atualizar orçamento do utilizador
router.put('/user/budget', verificarToken, async (req, res) => {
  try {
    const { budget } = req.body;
    const settingsCollection = getCollection('user_settings');
    
    await settingsCollection.updateOne(
      { utilizadorId: req.utilizador.id },
      { $set: { budget: parseFloat(budget), dataAtualizacao: new Date() } },
      { upsert: true }
    );
    
    res.json({ message: 'Orçamento atualizado!', budget });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar orçamento.' });
  }
});

// 3. ROTA GET - Obter configurações de fumo
router.get('/user/smoke-settings', verificarToken, async (req, res) => {
  try {
    const settingsCollection = getCollection('user_settings');
    const settings = await settingsCollection.findOne({ utilizadorId: req.utilizador.id });
    res.json({ 
      precoMaco: settings?.precoMaco || '5.00',
      qtdMaco: settings?.qtdMaco || '20'
    });
  } catch (error) {
    console.error('Erro ao buscar configurações de fumo:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

// 4. ROTA PUT - Atualizar configurações de fumo
router.put('/user/smoke-settings', verificarToken, async (req, res) => {
  try {
    const { precoMaco, qtdMaco } = req.body;
    const settingsCollection = getCollection('user_settings');
    
    await settingsCollection.updateOne(
      { utilizadorId: req.utilizador.id },
      { $set: { precoMaco, qtdMaco, dataAtualizacao: new Date() } },
      { upsert: true }
    );
    
    res.json({ message: 'Configurações de fumo atualizadas!' });
  } catch (error) {
    console.error('Erro ao atualizar configurações de fumo:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações.' });
  }
});

// ========================================================
// ROTAS DE DICAS DIÁRIAS
// ========================================================

// 1. ROTA GET - Obter dica do dia
router.get('/daily-tips', verificarToken, async (req, res) => {
  try {
    await ensureDailyTipsSeeded();
    const tipsCollection = getCollection('daily_tips');
    const allTips = await tipsCollection.find({}).sort({ dayOfMonth: 1, _id: 1 }).toArray();
    
    if (allTips.length === 0) {
      return res.status(404).json({ error: 'Nenhuma dica disponível.' });
    }

    // Mapeia 1 dica por dia do mes (1..31) a partir do campo dayOfMonth.
    const diaDoMes = new Date().getDate();
    const dicaDoDia = allTips.find((tip) => Number(tip.dayOfMonth) === diaDoMes);

    if (dicaDoDia) {
      return res.json(dicaDoDia);
    }

    const indiceFallback = (diaDoMes - 1) % allTips.length;
    return res.json(allTips[indiceFallback]);
  } catch (error) {
    console.error('Erro ao buscar dica do dia:', error);
    res.status(500).json({ error: 'Erro ao buscar dica.' });
  }
});

// 2. ROTA GET - Obter todas as dicas
router.get('/daily-tips/all', verificarToken, async (req, res) => {
  try {
    await ensureDailyTipsSeeded();
    const tipsCollection = getCollection('daily_tips');
    const tips = await tipsCollection.find({}).sort({ dayOfMonth: 1, _id: 1 }).toArray();
    res.json(tips);
  } catch (error) {
    console.error('Erro ao buscar dicas:', error);
    res.status(500).json({ error: 'Erro ao buscar dicas.' });
  }
});

// 2.1 ROTA POST - Seed inicial de 31 dicas (upsert por dia)
router.post('/daily-tips/seed', verificarToken, async (req, res) => {
  try {
    const tipsCollection = getCollection('daily_tips');

    const operations = DAILY_TIPS_SEED.map((tip) => ({
      updateOne: {
        filter: { dayOfMonth: tip.dayOfMonth },
        update: {
          $set: {
            texto: tip.texto,
            categoria: tip.categoria,
            dayOfMonth: tip.dayOfMonth,
            dataAtualizacao: new Date(),
          },
          $setOnInsert: {
            dataCriacao: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await tipsCollection.bulkWrite(operations);
    res.json({
      message: 'Seed de dicas executado com sucesso.',
      total: DAILY_TIPS_SEED.length,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    });
  } catch (error) {
    console.error('Erro ao executar seed de dicas:', error);
    res.status(500).json({ error: 'Erro ao executar seed de dicas.' });
  }
});

// 3. ROTA POST - Adicionar nova dica (Admin)
router.post('/daily-tips', async (req, res) => {
  try {
    const { texto, categoria } = req.body;
    
    if (!texto) {
      return res.status(400).json({ error: 'Texto da dica é obrigatório.' });
    }

    const tipsCollection = getCollection('daily_tips');
    const novaDica = {
      texto,
      categoria: categoria || 'geral',
      dataCriacao: new Date()
    };

    await tipsCollection.insertOne(novaDica);
    res.status(201).json({ message: 'Dica adicionada!', novaDica });
  } catch (error) {
    console.error('Erro ao adicionar dica:', error);
    res.status(500).json({ error: 'Erro ao adicionar dica.' });
  }
});

export default router;