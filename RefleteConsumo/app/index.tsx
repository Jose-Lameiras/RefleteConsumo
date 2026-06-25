import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_STORAGE_KEY = 'hasSeenPostLoginIntro';
const QUIZ_COMPLETED_KEY = 'quizCompleted';

export default function Index() {
  const [routeTarget, setRouteTarget] = useState<'loading' | 'login' | 'intro' | 'quiz' | 'tabs'>('loading');

  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
          setRouteTarget('login');
          return;
        }

        // Verificação extra: consulta o backend para ver se o token ainda é válido
        // Isto evita que o utilizador tente entrar com um token expirado
        const response = await fetch('https://refleteconsumo-api.onrender.com/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const hasSeenIntro = await AsyncStorage.getItem(INTRO_STORAGE_KEY);
          const hasCompletedQuiz = await AsyncStorage.getItem(QUIZ_COMPLETED_KEY);

          if (hasSeenIntro !== 'true') {
            setRouteTarget('intro');
          } else if (hasCompletedQuiz !== 'true') {
            setRouteTarget('quiz');
          } else {
            setRouteTarget('tabs');
          }
        } else {
          // Token inválido ou expirado
          await AsyncStorage.removeItem('userToken');
          setRouteTarget('login');
        }
      } catch (error) {
        setRouteTarget('login');
      }
    };

    verificarSessao();
  }, []);

  if (routeTarget === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2ec4b6" />
      </View>
    );
  }

  if (routeTarget === 'login') return <Redirect href="/login" />;
  if (routeTarget === 'intro') return <Redirect href="/intro" />;
  if (routeTarget === 'quiz') return <Redirect href="/quiz" />;

  return <Redirect href="/(tabs)" />;
}