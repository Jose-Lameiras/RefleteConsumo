import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      {/* Campo: Nome */}
      <Text style={styles.label}>Nome Completo:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Insere o teu nome e apelido" 
        value={nome} 
        onChangeText={setNome} 
      />
      
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
        placeholder="Escolhe uma palavra-passe segura" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
      />
      
      {/* Campo: Confirmar Palavra-Passe */}
      <Text style={styles.label}>Confirmar Palavra-Passe:</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Digita novamente a palavra-passe" 
        secureTextEntry 
        value={confirmPassword} 
        onChangeText={setConfirmPassword} 
      />
      
      {/* Campo: Género */}
      <Text style={styles.label}>Género:</Text>
      <View style={styles.row}>
        {['Masculino', 'Feminino', 'Outro'].map((g) => (
          <TouchableOpacity key={g} onPress={() => setGenero(g)} style={[styles.radio, genero === g && styles.radioActive]}>
            <Text>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campo: Fumador */}
      <View style={styles.rowHabito}>
        <Text style={styles.labelHabito}>És fumador?</Text>
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
  input: { borderWidth: 1, padding: 15, marginBottom: 15, borderRadius: 5, borderColor: '#ccc' },
  label: { marginTop: 5, marginBottom: 5, fontWeight: 'bold', color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, marginTop: 5 },
  rowHabito: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  labelHabito: { fontWeight: 'bold', color: '#333' },
  radio: { padding: 10, borderWidth: 1, borderRadius: 5, borderColor: '#ccc', minWidth: 90, alignItems: 'center' },
  radioActive: { backgroundColor: '#ddd', borderColor: '#888' },
  button: { backgroundColor: '#000', padding: 15, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});