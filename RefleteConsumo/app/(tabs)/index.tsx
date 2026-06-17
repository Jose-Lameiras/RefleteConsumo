import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router'; // Ferramenta para ler o que a outra página enviou

export default function HomeScreen() {
  const [nomeItem, setNomeItem] = useState('');
  const [preco, setPreco] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Apanha a pulseira VIP (token) que o LoginScreen enviou
  const { token } = useLocalSearchParams(); 

  const handleInserir = async () => {
    if (!token) {
      Alert.alert('Erro', 'Não estás logado! Volta à página de login.');
      return;
    }

    if (!nomeItem || !preco) {
      Alert.alert('Aviso', 'Por favor, preenche todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.50.152:3000/api/desejos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // O teu novo "session_start"
        },
        body: JSON.stringify({
          nome: nomeItem,
          preco: parseFloat(preco.replace(',', '.')), 
        }),
      });

      if (response.ok) {
        Alert.alert('RefleteConsumo', `Desejo registado! Espera pelo prazo de reflexão.`);
        setNomeItem(''); 
        setPreco('');
      } else {
        const errorData = await response.json();
        Alert.alert('Erro', errorData.error || 'Ocorreu um erro.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível ligar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>RefleteConsumo</Text>
      <Text style={style.subtitle}>Inserir Potencial Gasto</Text>

      <TextInput 
        style={style.input} 
        placeholder="Nome do item (ex: Telemóvel)" 
        value={nomeItem}
        onChangeText={setNomeItem}
      />

      <TextInput 
        style={style.input} 
        placeholder="Preço estimado (€)" 
        keyboardType="numeric"
        value={preco}
        onChangeText={setPreco}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : (
        <Button title="Inserir Desejo" onPress={handleInserir} color="#2ec4b6" />
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#1d3557' },
  subtitle: { fontSize: 18, marginBottom: 20, color: '#457b9d' },
  input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 15 },
});