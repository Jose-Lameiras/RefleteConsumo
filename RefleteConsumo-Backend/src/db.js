import pkg from 'mongodb';
const { MongoClient } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Erro: MONGODB_URI não está definido no ficheiro .env');
  process.exit(1);
}

const client = new MongoClient(uri);
let db;

// Função para ligar à BD (chamada no server.js)
export async function connectDB() {
  if (db) return db;
  
  await client.connect();
  console.log('✅ Ligado ao MongoDB Atlas com sucesso!');
  db = client.db('refleteconsumo');
  return db;
}

// Função auxiliar para aceder às coleções nas rotas
export function getCollection(collectionName) {
  if (!db) {
    throw new Error('Base de dados não inicializada. Chama connectDB() primeiro.');
  }
  return db.collection(collectionName);
}