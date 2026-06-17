import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegistoScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegisto = async () => {
    // 1. Verificações de segurança no telemóvel
    if (!email || !password || !confirmPassword) {
      return Alert.alert('Aviso', 'Por favor, preenche todos os campos.');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Aviso', 'As passwords não coincidem. Tenta novamente.');
    }

    setIsLoading(true);

    try {
      // 2. Enviar para o Backend
      const response = await fetch('http://192.168.50.152:3000/api/registo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso!', 'A tua conta foi criada. Já podes fazer login.');
        // 3. Manda o utilizador de volta para a página de login
        router.replace('/login');
      } else {
        Alert.alert('Erro', data.error || 'Não foi possível registar.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ligar ao servidor. Verifica a tua rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Nova Conta</Text>
      <Text style={style.subtitle}>Junta-te ao RefleteConsumo</Text>

      <TextInput 
        style={style.input} 
        placeholder="O teu Email" 
        autoCapitalize="none" 
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail} 
      />
      
      <TextInput 
        style={style.input} 
        placeholder="Cria uma Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
      />

      <TextInput 
        style={style.input} 
        placeholder="Confirma a Password" 
        secureTextEntry 
        value={confirmPassword} 
        onChangeText={setConfirmPassword} 
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#457b9d" />
      ) : (
        <View style={style.btnContainer}>
          <Button title="Registar" onPress={handleRegisto} color="#457b9d" />
          <View style={{ marginVertical: 10 }} />
          <Button title="Já tenho conta (Voltar)" onPress={() => router.replace('/login')} color="#6c757d" />
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