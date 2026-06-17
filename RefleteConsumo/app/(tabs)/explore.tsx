import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function TabTwoScreen() {
  const [desejos, setDesejos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      buscarDesejos();
    }, [])
  );

  const buscarDesejos = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setDesejos(data);
      else setDesejos([]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a lista.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken'); 
    router.replace('/login'); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Desejos</Text>
        <Button title="Sair (Logout)" onPress={handleLogout} color="#e63946" />
      </View>

      <View style={styles.navContainer}>
        <Button title="⬅️ Voltar para Inserir Desejos" onPress={() => router.navigate('/(tabs)')} color="#457b9d" />
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : desejos.length === 0 ? (
        <Text style={styles.emptyText}>Lista vazia.</Text>
      ) : (
        <FlatList
          data={desejos}
          keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardPrice}>{item.preco} €</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1d3557' },
  navContainer: { marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#6c757d', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  cardPrice: { fontSize: 18, color: '#e63946', marginTop: 5 },
});