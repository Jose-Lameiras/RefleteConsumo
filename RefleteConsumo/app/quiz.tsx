import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QUIZ_QUESTIONS,
  calcularQuizResult,
  QuizResult,
} from '@/constants/quiz-questions';

const INTRO_STORAGE_KEY = 'hasSeenPostLoginIntro';
const QUIZ_COMPLETED_KEY = 'quizCompleted';

export default function QuizScreen() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResposta = (valor: number) => {
    const novasRespostas = [...respostas, valor];
    setRespostas(novasRespostas);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Última pergunta - calcular resultado
      const quizResult = calcularQuizResult(novasRespostas);
      setResult(quizResult);
      setQuizCompleted(true);
    }
  };

  const handleVoltar = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setRespostas(respostas.slice(0, -1));
    }
  };

  const handleGuardarResultado = async () => {
    if (!result) return;

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      // Guardar localmente
      await AsyncStorage.setItem('quizScore', result.score.toString());
      await AsyncStorage.setItem('quizPerfil', result.perfil);
      await AsyncStorage.setItem(QUIZ_COMPLETED_KEY, 'true');
      await AsyncStorage.setItem(INTRO_STORAGE_KEY, 'true');

      // Enviar para backend
      const response = await fetch(
        'https://refleteconsumo-api.onrender.com/api/quiz',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score: result.score,
            perfil: result.perfil,
            respostas,
            dataRealizacao: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Sucesso', 'Quiz guardado com sucesso!');
        setTimeout(() => router.replace('/(tabs)'), 500);
      } else {
        Alert.alert('Aviso', 'Quiz guardado localmente. Sincronizará mais tarde.');
        setTimeout(() => router.replace('/(tabs)'), 500);
      }
    } catch (error) {
      console.error('Erro ao guardar quiz:', error);
      Alert.alert('Aviso', 'Quiz guardado localmente. Sincronizará mais tarde.');
      setTimeout(() => router.replace('/(tabs)'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReiniciarQuiz = () => {
    setCurrentQuestion(0);
    setRespostas([]);
    setQuizCompleted(false);
    setResult(null);
  };

  if (quizCompleted && result) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultContainer}>
          {/* Ícone do resultado */}
          <View
            style={[
              styles.perfilBadge,
              result.perfil === 'consciente'
                ? styles.consciente
                : result.perfil === 'normal'
                  ? styles.normal
                  : styles.compulsivo,
            ]}
          >
            <Text style={styles.perfilIcon}>
              {result.perfil === 'consciente'
                ? '✨'
                : result.perfil === 'normal'
                  ? '📊'
                  : '⚠️'}
            </Text>
          </View>

          {/* Título */}
          <Text style={styles.resultTitle}>
            Seu Perfil de Consumo:{'\n'}
            <Text
              style={
                result.perfil === 'consciente'
                  ? styles.conscienteText
                  : result.perfil === 'normal'
                    ? styles.normalText
                    : styles.compulsivoText
              }
            >
              {result.perfil === 'consciente'
                ? 'Consumidor Consciente'
                : result.perfil === 'normal'
                  ? 'Consumidor Normal'
                  : 'Consumidor Compulsivo'}
            </Text>
          </Text>

          {/* Score */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Pontuação</Text>
            <Text style={styles.scoreValue}>{result.score}/40</Text>
          </View>

          {/* Descrição */}
          <Text style={styles.descricao}>{result.descricao}</Text>

          {/* Dicas */}
          <View style={styles.dicasContainer}>
            <Text style={styles.dicasTitle}>💡 Dicas para melhorar:</Text>
            {result.dicas.map((dica, index) => (
              <View key={index} style={styles.dicaItem}>
                <Text style={styles.dicaBullet}>•</Text>
                <Text style={styles.dicaText}>{dica}</Text>
              </View>
            ))}
          </View>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonSecundario}
              onPress={handleReiniciarQuiz}
            >
              <Text style={styles.buttonSecundarioText}>Refazer Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonPrimario}
              onPress={handleGuardarResultado}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimarioText}>Continuar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const pergunta = QUIZ_QUESTIONS[currentQuestion];
  const progresso = Math.round(((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100);

  return (
    <View style={styles.container}>
      {/* Header com progresso */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Questionário</Text>
        <Text style={styles.headerSubtitle}>
          Pergunta {currentQuestion + 1} de {QUIZ_QUESTIONS.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progresso}%` },
            ]}
          />
        </View>
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content}>
        <Text style={styles.pergunta}>{pergunta.pergunta}</Text>

        {/* Opções */}
        <View style={styles.opcoesContainer}>
          {pergunta.opcoes.map((opcao, index) => (
            <TouchableOpacity
              key={index}
              style={styles.opcao}
              onPress={() => handleResposta(pergunta.valores[index])}
            >
              <View style={styles.opcaoRadio} />
              <Text style={styles.opcaoText}>{opcao}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Botões de navegação */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.botaoNavegacao,
            currentQuestion === 0 && styles.botaoDesabilitado,
          ]}
          onPress={handleVoltar}
          disabled={currentQuestion === 0}
        >
          <Text
            style={[
              styles.botaoNavegacaoText,
              currentQuestion === 0 && styles.botaoDesabilitadoText,
            ]}
          >
            ← Anterior
          </Text>
        </TouchableOpacity>

        <Text style={styles.progressText}>{progresso}%</Text>

        <TouchableOpacity style={styles.botaoNavegacao} disabled>
          <Text style={styles.botaoNavegacaoText}>Próxima →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2ec4b6',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pergunta: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
    lineHeight: 26,
  },
  opcoesContainer: {
    gap: 12,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  opcaoRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2ec4b6',
    marginRight: 12,
  },
  opcaoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  botaoNavegacao: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  botaoNavegacaoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ec4b6',
  },
  botaoDesabilitado: {
    opacity: 0.4,
  },
  botaoDesabilitadoText: {
    color: '#ccc',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },

  /* Resultado */
  resultContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  perfilBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  consciente: {
    backgroundColor: '#d4edda',
  },
  normal: {
    backgroundColor: '#fff3cd',
  },
  compulsivo: {
    backgroundColor: '#f8d7da',
  },
  perfilIcon: {
    fontSize: 60,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 32,
  },
  conscienteText: {
    color: '#155724',
  },
  normalText: {
    color: '#856404',
  },
  compulsivoText: {
    color: '#721c24',
  },
  scoreBox: {
    backgroundColor: '#2ec4b6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  descricao: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  dicasContainer: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2ec4b6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 25,
  },
  dicasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dicaItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dicaBullet: {
    fontSize: 16,
    color: '#2ec4b6',
    marginRight: 10,
    fontWeight: 'bold',
  },
  dicaText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonPrimario: {
    backgroundColor: '#2ec4b6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPrimarioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecundario: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2ec4b6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecundarioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ec4b6',
  },
});
