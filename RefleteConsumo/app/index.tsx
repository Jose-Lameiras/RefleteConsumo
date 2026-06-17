import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Função que vai "cuscar" a memória do telemóvel
    const verificarSessao = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setIsLoggedIn(true); // Tem token, está logado!
        } else {
          setIsLoggedIn(false); // Não tem token, não está logado.
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    verificarSessao();
  }, []);

  // Enquanto está a ler a memória, mostra a rodinha a girar
  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2ec4b6" />
      </View>
    );
  }

  // O momento da decisão (O teu "if($_SESSION)" do PHP)
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}