import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function TabTwoScreen() {
  const [desejos, setDesejos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const buscarDesejos = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      // Importante: Se isto falhar silenciosamente, o ecrã fica vazio
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Erro na API');
      
      const data = await response.json();
      setDesejos(data);
    } catch (error) {
      console.log("Erro na busca:", error);
      Alert.alert('Erro', 'Não consegui ligar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { buscarDesejos(); }, []));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Desejos</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : (
        <FlatList
          data={desejos}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum desejo encontrado.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text>💰 {item.preco}€ | 📂 {item.categoria}</Text>
              <Text style={{ marginTop: 5, color: '#666' }}>
                Status: {item.status === 'em_reflexao' ? 'Em reflexão' : item.status}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 50, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});