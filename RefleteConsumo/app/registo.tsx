import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegistoScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Novos estados para enviar ao servidor
  const [genero, setGenero] = useState('Masculino');
  const [isFumador, setIsFumador] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegisto = async () => {
    if (!nome || !email || !password || !confirmPassword) {
      return Alert.alert('Erro', 'Por favor, preenche todos os campos.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Erro', 'As palavras-passe não coincidem.');
    }

    setIsLoading(true);

    try {
      // Enviamos TUDO para a base de dados de uma vez
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/registo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome, 
          email: email.trim(), 
          password,
          genero,       // <--- Enviado para a BD
          isFumador     // <--- Enviado para a BD
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso!', 'Conta criada com sucesso.');
        router.replace('/login');
      } else {
        Alert.alert('Erro', data.error || 'Falha no registo.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ligar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reflete Consumo!</Text>
      
      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Palavra-Passe" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirmar Palavra-Passe" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      
      <Text style={styles.label}>Género:</Text>
      <View style={styles.row}>
        {['Masculino', 'Feminino', 'Outro'].map((g) => (
          <TouchableOpacity key={g} onPress={() => setGenero(g)} style={[styles.radio, genero === g && styles.radioActive]}>
            <Text>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <Text>És fumador?</Text>
        <Switch value={isFumador} onValueChange={setIsFumador} />
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegisto}>
          <Text style={styles.buttonText}>Registar</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, padding: 15, marginBottom: 15, borderRadius: 5 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  radio: { padding: 10, borderWidth: 1, borderRadius: 5 },
  radioActive: { backgroundColor: '#ddd' },
  button: { backgroundColor: '#000', padding: 15, alignItems: 'center', borderRadius: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});