import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [nomeItem, setNomeItem] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cooldownValue, setCooldownValue] = useState(''); // Novo estado para a quantidade (ex: 1, 5, 2)
  const [cooldownUnit, setCooldownUnit] = useState('dias'); // Novo estado para a unidade (padrão: dias)
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Opções flexíveis alinhadas com o teu novo backend
  const unidadesTempo = ['minutos', 'horas', 'dias', 'meses'];

  const handleInserir = async () => {
    if (!nomeItem || !preco || !categoria || !cooldownValue) {
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
          cooldownValue: cooldownValue, // Enviado para a API flexível
          cooldownUnit: cooldownUnit    // Enviado para a API flexível
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Desejo registado!');
        setNomeItem(''); 
        setPreco(''); 
        setCategoria('');
        setCooldownValue('');
        setCooldownUnit('dias');
      } else {
        const data = await response.json();
        Alert.alert('Erro', data.error || 'Falha ao guardar desejo.');
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

      {/* Novo campo: Quantidade de Tempo */}
      <Text style={style.label}>Tempo para Reflexão (Valor):</Text>
      <TextInput style={style.input} keyboardType="numeric" value={cooldownValue} onChangeText={setCooldownValue} placeholder="Ex: 1, 5, 2..." />

      {/* Novo campo: Seletor Visual de Unidade de Tempo */}
      <Text style={style.label}>Unidade de Tempo:</Text>
      <View style={style.row}>
        {unidadesTempo.map((unidade) => (
          <TouchableOpacity 
            key={unidade} 
            onPress={() => setCooldownUnit(unidade)} 
            style={[style.radio, cooldownUnit === unidade && style.radioActive]}
          >
            <Text style={[style.radioText, cooldownUnit === unidade && style.radioTextActive]}>
              {unidade.charAt(0).toUpperCase() + unidade.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : (
        <TouchableOpacity style={style.button} onPress={handleInserir}>
          <Text style={style.buttonText}>Guardar Desejo</Text>
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
    marginBottom: 20, 
    color: '#000000' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 5, 
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
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25, 
    marginTop: 5 
  },
  radio: { 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderRadius: 8, 
    borderColor: '#cccccc', 
    flex: 1, 
    marginRight: 4, 
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  radioActive: { 
    backgroundColor: '#2ec4b6', 
    borderColor: '#2ec4b6' 
  },
  radioText: { 
    fontSize: 11, 
    color: '#555555', 
    fontWeight: '500' 
  },
  radioTextActive: { 
    color: '#ffffff', 
    fontWeight: 'bold' 
  },
  button: { 
    backgroundColor: '#2ec4b6', 
    padding: 14, 
    alignItems: 'center', 
    borderRadius: 8, 
    marginTop: 10 
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});