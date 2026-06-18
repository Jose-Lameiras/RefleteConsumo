import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GastosScreen() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      buscarGastos();
    }, [])
  );

  const buscarGastos = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/gastos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setGastos(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os gastos.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalGasto = gastos.reduce((acc, item) => acc + item.preco, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área de Gastos</Text>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Gasto</Text>
        <Text style={styles.totalValue}>{totalGasto.toFixed(2)} €</Text>
      </View>

      {isLoading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={gastos}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemPreco}>{item.preco} €</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  totalCard: { backgroundColor: '#1d3557', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: '#fff', fontSize: 16 },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  itemNome: { fontSize: 16 },
  itemPreco: { fontSize: 16, fontWeight: 'bold', color: '#e63946' }
});