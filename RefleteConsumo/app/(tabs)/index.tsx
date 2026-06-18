import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HomeScreen() {
  const [nomeItem, setNomeItem] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dataAlvo, setDataAlvo] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDataAlvo(selectedDate);
  };

  const handleInserir = async () => {
    if (!nomeItem || !preco || !categoria) {
      Alert.alert('Aviso', 'Preenche todos os campos.');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Calculamos a diferença de dias para enviar ao backend
      const diffTime = dataAlvo.getTime() - new Date().getTime();
      const diasCooldown = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          nome: nomeItem, 
          preco: parseFloat(preco.replace(',', '.')),
          categoria,
          diasCooldown 
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Desejo registado!');
        setNomeItem(''); setPreco(''); setCategoria('');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Novo Desejo</Text>
      
      <Text style={style.label}>Nome do Produto:</Text>
      <TextInput style={style.input} value={nomeItem} onChangeText={setNomeItem} placeholder="Ex: Ténis de corrida" />
      
      <Text style={style.label}>Preço (€):</Text>
      <TextInput style={style.input} keyboardType="numeric" value={preco} onChangeText={setPreco} placeholder="0.00" />
      
      <Text style={style.label}>Categoria:</Text>
      <TextInput style={style.input} value={categoria} onChangeText={setCategoria} placeholder="Ex: Lazer" />

      <Text style={style.label}>Data para Reflexão:</Text>
      <TouchableOpacity style={style.dateButton} onPress={() => setShowPicker(true)}>
        <Text>{dataAlvo.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker value={dataAlvo} mode="date" display="default" onChange={handleDateChange} minimumDate={new Date()} />
      )}

      {isLoading ? <ActivityIndicator size="large" color="#2ec4b6" /> : <Button title="Guardar Desejo" onPress={handleInserir} color="#2ec4b6" /> }
    </View>
  );
}

const style = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: '#ffffff' // Fundo branco fixo
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#000000' // Texto preto
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 5, 
    color: '#333333' // Texto cinzento escuro
  },
  input: { 
    height: 45, 
    borderWidth: 1, 
    borderColor: '#cccccc', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 15,
    color: '#000000', // Texto digitado preto
    backgroundColor: '#f9f9f9' // Fundo cinzento muito claro para contraste
  },
  dateButton: { 
    height: 45, 
    borderWidth: 1, 
    borderColor: '#2ec4b6', 
    borderRadius: 8, 
    justifyContent: 'center', 
    paddingHorizontal: 10, 
    marginBottom: 20,
    backgroundColor: '#ffffff'
  }
});