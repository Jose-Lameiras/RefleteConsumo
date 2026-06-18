import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View, Platform, TouchableOpacity, ScrollView } from 'react-native';
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
    // No Android, fecha o picker ao selecionar; no iOS mantém o comportamento padrão
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
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

      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          nome: nomeItem, 
          preco: parseFloat(preco.replace(',', '.')),
          categoria,
          dataLiberacao: dataAlvo.toISOString() // Enviamos a data e hora exata que deslizaste
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Desejo registado!');
        setNomeItem(''); 
        setPreco(''); 
        setCategoria('');
        setDataAlvo(new Date()); // Faz reset para a hora atual
      } else {
        Alert.alert('Erro', 'Não foi possível guardar o desejo.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={style.container}>
      <Text style={style.title}>Novo Desejo</Text>
      
      <Text style={style.label}>Nome do Produto:</Text>
      <TextInput style={style.input} value={nomeItem} onChangeText={setNomeItem} placeholder="Ex: Ténis de corrida" />
      
      <Text style={style.label}>Preço (€):</Text>
      <TextInput style={style.input} keyboardType="numeric" value={preco} onChangeText={setPreco} placeholder="0.00" />
      
      <Text style={style.label}>Categoria:</Text>
      <TextInput style={style.input} value={categoria} onChangeText={setCategoria} placeholder="Ex: Lazer" />

      <Text style={style.label}>Definir Data e Hora de Libertação:</Text>
      <TouchableOpacity style={style.dateButton} onPress={() => setShowPicker(true)}>
        {/* Mostra a data, horas e minutos escolhidos no botão */}
        <Text style={style.dateText}>
          📅 {dataAlvo.toLocaleDateString()} às {dataAlvo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={style.pickerWrapper}>
          <DateTimePicker 
            value={dataAlvo} 
            mode="datetime"       // <--- Ativa Data + Hora juntas
            display="spinner"     // <--- Força o efeito de rodas para deslizar
            onChange={handleDateChange} 
            minimumDate={new Date()} 
            textColor="#000000"   // Garante visibilidade no iOS
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={style.closeButtonIOS} onPress={() => setShowPicker(false)}>
              <Text style={style.closeButtonTextIOS}>Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : (
        <TouchableOpacity style={style.submitButton} onPress={handleInserir}>
          <Text style={style.submitButtonText}>Guardar Desejo</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const style = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: '#ffffff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 25, 
    color: '#000000' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 6, 
    color: '#333333' 
  },
  input: { 
    height: 45, 
    borderWidth: 1, 
    borderColor: '#cccccc', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 15,
    color: '#000000', 
    backgroundColor: '#f9f9f9' 
  },
  dateButton: { 
    height: 48, 
    borderWidth: 1, 
    borderColor: '#2ec4b6', 
    borderRadius: 8, 
    justifyContent: 'center', 
    paddingHorizontal: 12, 
    marginBottom: 25,
    backgroundColor: '#ffffff'
  },
  dateText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500'
  },
  pickerWrapper: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
    padding: 10
  },
  closeButtonIOS: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2ec4b6',
    borderRadius: 6,
    marginTop: 10
  },
  closeButtonTextIOS: {
    color: '#fff',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: '#2ec4b6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});