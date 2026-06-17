import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

export default function TabTwoScreen() {
  // Avisamos o TypeScript que esta lista vai conter um array de objetos (any[])
  const [desejos, setDesejos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // O useFocusEffect faz com que a lista seja atualizada (vá à API) 
  // sempre que clicas no separador "Explore" no fundo do ecrã!
  useFocusEffect(
    useCallback(() => {
      buscarDesejos();
    }, [])
  );

  const buscarDesejos = async () => {
    try {
      setIsLoading(true); // Mostra a rodinha sempre que tenta atualizar
      // Atualizado para a nova rota do teu backend
      const response = await fetch('http://192.168.50.152:3000/api/desejos');
      const data = await response.json();
      
      // Garante que o que recebemos é uma lista (array) antes de guardar
      if (Array.isArray(data)) {
        setDesejos(data);
      } else {
        setDesejos([]);
        console.error("Formato inesperado recebido:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar desejos:', error);
      Alert.alert('Erro de Ligação', 'Não foi possível carregar a lista de desejos. O servidor está a correr?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Os Meus Desejos</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : desejos.length === 0 ? (
        <Text style={styles.emptyText}>Ainda não registaste nenhum desejo.</Text>
      ) : (
        <FlatList
          data={desejos}
          keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardPrice}>{item.preco} €</Text>
              <Text style={styles.cardStatus}>Estado: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d3557',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 50,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardPrice: {
    fontSize: 18,
    color: '#e63946',
    marginTop: 5,
  },
  cardStatus: {
    fontSize: 14,
    color: '#2ec4b6',
    marginTop: 10,
    textTransform: 'capitalize',
  },
});
