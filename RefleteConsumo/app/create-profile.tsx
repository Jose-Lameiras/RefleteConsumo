import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateProfileScreen() {
  const [isFumador, setIsFumador] = useState(false);
  const [genero, setGenero] = useState(''); // Estado para guardar a escolha
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFinalizar = async () => {
    if (!genero) return Alert.alert('Atenção', 'Por favor, selecione um género.');
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Atualizar perfil no MongoDB
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/update-perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ genero, isFumador })
      });

      if (!response.ok) throw new Error('Erro ao atualizar perfil');
      
      // Redirecionar para o Quiz
      router.replace('/quiz');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reflete Consumo!</Text>
      <Text style={styles.subtitle}>Criar Perfil</Text>

      <Text style={styles.label}>Qual é o seu género?</Text>
      
      {/* Botões de Seleção com Cor e Marcação */}
      <View style={styles.options}>
        {['Masculino', 'Feminino', 'Outro'].map((item) => (
          <TouchableOpacity key={item} style={styles.optRow} onPress={() => setGenero(item)}>
            <View style={[styles.checkbox, genero === item && styles.checkboxSelected]}>
              {genero === item && <Text style={styles.checkmark}>X</Text>}
            </View>
            <Text style={styles.optText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fuma? </Text>
        <Switch 
          value={isFumador} 
          onValueChange={setIsFumador}
          trackColor={{ false: '#ccc', true: '#457b9d' }}
          thumbColor={isFumador ? '#1d3557' : '#f4f3f4'}
        />
        <Text style={{ marginLeft: 10, fontWeight: 'bold' }}>{isFumador ? 'Sim' : 'Não'}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1d3557" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleFinalizar}>
          <Text style={styles.buttonText}>Finalizar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#f1faee' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1d3557' },
  subtitle: { fontSize: 20, textAlign: 'center', marginBottom: 40, color: '#457b9d' },
  label: { fontSize: 18, marginBottom: 15, fontWeight: 'bold', color: '#1d3557' },
  options: { marginBottom: 30 },
  optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: { width: 30, height: 30, borderWidth: 2, borderColor: '#1d3557', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderRadius: 5 },
  checkboxSelected: { backgroundColor: '#a8dadc', borderColor: '#1d3557' },
  checkmark: { fontSize: 18, fontWeight: 'bold', color: '#1d3557' },
  optText: { fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  button: { backgroundColor: '#1d3557', padding: 15, alignItems: 'center', borderRadius: 8 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' }
});