import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function TabTwoScreen() {
  const [desejos, setDesejos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0); // Força o ecrã a atualizar o tempo visualmente

  // Atualiza o ecrã automaticamente a cada 10 segundos para a contagem decrescer
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const buscarDesejos = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
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

  // Função que calcula dinamicamente quanto tempo falta
  const obterTempoRestante = (dataLiberacaoStr: string) => {
    const agora = new Date().getTime();
    const libertacao = new Date(dataLiberacaoStr).getTime();
    const diferenca = libertacao - agora;

    // Se o tempo de reflexão já terminou
    if (diferenca <= 0) {
      return "🎉 Tempo concluído! Podes decidir.";
    }

    const minutosTotais = Math.floor(diferenca / (1000 * 60));
    const horasTotais = Math.floor(minutosTotais / 60);
    const dias = Math.floor(horasTotais / 24);

    const minutosRestantes = minutosTotais % 60;
    const horasRestantes = horasTotais % 24;

    // Mostra o formato ideal dependendo do tempo que falta
    if (dias > 0) {
      return `Faltam ${dias}d ${horasRestantes}h ${minutosRestantes}m`;
    }
    if (horasTotais > 0) {
      return `Faltam ${horasTotais}h ${minutosRestantes}m`;
    }
    return `Faltam ${minutosTotais} min`;
  };

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
          renderItem={({ item }) => {
            const jaTerminou = new Date(item.dataLiberacao).getTime() - new Date().getTime() <= 0;

            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text>💰 {item.preco}€ | 📂 {item.categoria}</Text>
                
                <Text style={{ marginTop: 5, color: '#666', fontWeight: '500' }}>
                  Status: {item.status === 'em_reflexao' ? 'Em reflexão' : item.status}
                </Text>

                {/* Mostra o tempo restante dinâmico em vez da data fixa */}
                {item.status === 'em_reflexao' && item.dataLiberacao && (
                  <Text style={[
                    styles.cooldownText, 
                    jaTerminou && styles.readyText
                  ]}>
                    ⏳ {obterTempoRestante(item.dataLiberacao)}
                  </Text>
                )}
              </View>
            );
          }}
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
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
  cooldownText: { fontSize: 12, color: '#e63946', marginTop: 5, fontWeight: 'bold' },
  readyText: { color: '#2ec4b6' } // Fica verde quando o tempo chega a zero!
});