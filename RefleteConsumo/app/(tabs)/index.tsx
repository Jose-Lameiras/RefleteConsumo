import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [nomeItem, setNomeItem] = useState('');
  const [preco, setPreco] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInserir = async () => {
    if (!nomeItem || !preco) {
      Alert.alert('Aviso', 'Preenche todos os campos.');
      return;
    }
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada.');
        router.replace('/login');
        return;
      }
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ nome: nomeItem, preco: parseFloat(preco.replace(',', '.')) }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Desejo registado!');
        setNomeItem(''); 
        setPreco('');
      } else {
        const errorData = await response.json();
        Alert.alert('Erro', errorData.error || 'Ocorreu um erro.');
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
      <Text style={style.subtitle}>O que queres comprar?</Text>

      <TextInput 
        style={style.input} 
        placeholder="Nome do item" 
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

      {/* BOTÃO PARA IR VER OS DESEJOS */}
      <View style={style.navContainer}>
        <Button title="👉 Ver os meus desejos" onPress={() => router.navigate('/(tabs)/explore')} color="#457b9d" />
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1d3557', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#457b9d', textAlign: 'center', marginBottom: 30 },
  input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff' },
  navContainer: { marginTop: 40 }
});