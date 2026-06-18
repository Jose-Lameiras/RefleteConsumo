import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function TabTwoScreen() {
  const [desejos, setDesejos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0); // Força o ecrã a atualizar a contagem a cada segundo

  // Ativa uma atualização a cada 1 segundo para manter a contagem decrescente viva
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000); 
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

  // Envia a decisão de comprar ou cancelar para o Servidor
  const handleDecidir = async (desejoId: string, comprar: boolean) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos/decidir', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ desejoId, comprar }),
      });

      if (response.ok) {
        Alert.alert(
          'Sucesso!', 
          comprar ? 'Item comprado e enviado para os gastos! 💰' : 'Guardado como Desejo não comprado! ❌'
        );
        buscarDesejos(); // Recarrega a lista para atualizar o ecrã na hora
      } else {
        Alert.alert('Erro', 'Não foi possível processar a tua decisão.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na ligação ao servidor.');
    }
  };

  // Função que calcula a contagem decrescente pura
  const obtenerContagemDecrescente = (dataLiberacaoStr: string) => {
    const agora = new Date().getTime();
    const libertacao = new Date(dataLiberacaoStr).getTime();
    const diferenca = libertacao - agora;

    if (diferenca <= 0) {
      return "🎉 Tempo concluído! Podes decidir.";
    }

    const segundosTotais = Math.floor(diferenca / 1000);
    const minutosTotais = Math.floor(segundosTotais / 60);
    const horasTotais = Math.floor(minutosTotais / 60);
    const dias = Math.floor(horasTotais / 24);

    const segundosRestantes = segundosTotais % 60;
    const minutosRestantes = minutosTotais % 60;
    const horasRestantes = horasTotais % 24;

    if (dias > 0) {
      return `Faltam ${dias}d ${horasRestantes}h ${minutosRestantes}m`;
    }
    if (horasTotais > 0) {
      return `Faltam ${horasTotais}h ${minutosRestantes}m`;
    }
    return `Faltam ${minutosRestantes}m ${segundosRestantes}s`;
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
                <Text style={styles.cardInfo}>💰 {item.preco}€ | 📂 {item.categoria}</Text>
                
                <Text style={{ marginTop: 5, color: '#666', fontWeight: '500' }}>
                  Status: {item.status === 'em_reflexao' ? 'Em reflexão' : item.status}
                </Text>

                {item.status === 'em_reflexao' && item.dataLiberacao && (
                  <Text style={[
                    styles.cooldownText, 
                    jaTerminou && styles.readyText
                  ]}>
                    ⏳ {obtenerContagemDecrescente(item.dataLiberacao)}
                  </Text>
                )}

                {/* Botões de Ação: Aparecem apenas se o tempo acabou e continua em reflexão */}
                {item.status === 'em_reflexao' && jaTerminou && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.buyButton} 
                      onPress={() => handleDecidir(item._id, true)}
                    >
                      <Text style={styles.btnText}>Comprar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => handleDecidir(item._id, false)}
                    >
                      <Text style={styles.btnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
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
  cardInfo: { color: '#444', marginTop: 3 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
  cooldownText: { fontSize: 13, color: '#e63946', marginTop: 6, fontWeight: 'bold' },
  readyText: { color: '#2ec4b6', marginBottom: 5 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  buyButton: { backgroundColor: '#2ec4b6', flex: 1, marginRight: 6, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e63946', flex: 1, marginLeft: 6, paddingVertical: 10, borderRadius: 6, alignItems: 'center' }, // Botão de Cancelar Vermelho
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});