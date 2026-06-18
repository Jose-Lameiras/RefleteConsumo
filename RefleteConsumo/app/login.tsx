import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Erro', 'Por favor, preenche todos os campos.');
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar o token de autenticação enviado pelo teu backend
        await AsyncStorage.setItem('userToken', data.token);
        
        Alert.alert('Sucesso!', 'Login efetuado com sucesso.');
        
        // Redireciona para o ecrã principal (ajusta o caminho se for diferente, ex: '/(tabs)/desejos')
        router.replace('/perfil'); 
      } else {
        Alert.alert('Erro', data.error || 'Email ou password incorretos.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ligar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reflete Consumo</Text>

      {/* Campo: Email */}
      <Text style={styles.label}>Endereço de E-mail:</Text>
      <TextInput
        style={styles.input}
        placeholder="exemplo@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* Campo: Palavra-Passe */}
      <Text style={styles.label}>Palavra-Passe:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digita a tua palavra-passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      )}

      {/* Atalho para ir para o registo caso não tenha conta */}
      <TouchableOpacity 
        style={styles.registerLink} 
        onPress={() => router.push('/registo')}
      >
        <Text style={styles.registerText}>Não tens conta? Cria uma aqui</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: { borderWidth: 1, padding: 15, marginBottom: 20, borderRadius: 5, borderColor: '#ccc' },
  label: { marginBottom: 8, fontWeight: 'bold', color: '#333' },
  button: { backgroundColor: '#000', padding: 15, alignItems: 'center', borderRadius: 5, marginTop: 15 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  registerLink: { marginTop: 25, alignItems: 'center' },
  registerText: { color: '#666', textDecorationLine: 'underline' }
});