import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (!token) {
          setAuthStatus('unauthenticated');
          return;
        }

        // Verificação extra: consulta o backend para ver se o token ainda é válido
        // Isto evita que o utilizador tente entrar com um token expirado
        const response = await fetch('https://refleteconsumo-api.onrender.com/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setAuthStatus('authenticated');
        } else {
          // Token inválido ou expirado
          await AsyncStorage.removeItem('userToken');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
      }
    };

    verificarSessao();
  }, []);

  if (authStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2ec4b6" />
      </View>
    );
  }

  return authStatus === 'authenticated' ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}