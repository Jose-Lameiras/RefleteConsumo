import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- IMPORTANTE: Faltava importar isto!

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Aviso', 'Preenche tudo.');
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.50.152:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', 'Login feito!');
        // 1. GRAVAR NO DISCO RÍGIDO (O teu equivalente a $_SESSION['token'] = data.token)
        await AsyncStorage.setItem('userToken', data.token); 
        
        // 2. MUDAR DE PÁGINA
        router.replace('/(tabs)');
      } else {
        Alert.alert('Erro', data.error || 'Credenciais inválidas.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisto = async () => {
    if (!email || !password) return Alert.alert('Aviso', 'Preenche tudo.');
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.50.152:3000/api/registo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', 'Conta criada! Clica em Entrar.');
        setPassword('');
      } else {
        Alert.alert('Erro', data.error || 'Erro ao registar.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>RefleteConsumo</Text>
      <Text style={style.subtitle}>Identifica-te</Text>
      <TextInput style={style.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={style.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      
      {isLoading ? <ActivityIndicator size="large" color="#2ec4b6" /> : (
        <View style={style.btnContainer}>
          <Button title="Entrar" onPress={handleLogin} color="#2ec4b6" />
          <View style={{ marginVertical: 5 }} />
          <Button title="Criar Conta" onPress={handleRegisto} color="#457b9d" />
        </View>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1d3557', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#457b9d', marginBottom: 25 },
  input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 15 },
  btnContainer: { width: '100%', marginTop: 10 }
});