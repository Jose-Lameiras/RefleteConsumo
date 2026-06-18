import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SmokeTrackerScreen() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [precoMaco, setPrecoMaco] = useState<string>('5.00');
  const [qtdMaco, setQtdMaco] = useState<string>('20');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const carregarDadosFumo = async () => {
    try {
      setIsLoading(true);
      const salvoPreco = await AsyncStorage.getItem('smoke_precoMaco');
      const salvoQtd = await AsyncStorage.getItem('smoke_qtdMaco');
      if (salvoPreco) setPrecoMaco(salvoPreco);
      if (salvoQtd) setQtdMaco(salvoQtd);

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/smoke/historico', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistorico(data);
      }
    } catch (error) {
      console.log("Erro ao carregar dados de fumo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { carregarDadosFumo(); }, []));

  const handleFumeiAgora = async () => {
    try {
      await AsyncStorage.setItem('smoke_precoMaco', precoMaco);
      await AsyncStorage.setItem('smoke_qtdMaco', qtdMaco);

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/smoke/registar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          precoMaco: parseFloat(precoMaco.replace(',', '.')),
          quantidadeNoMaco: parseInt(qtdMaco)
        })
      });

      if (response.ok) {
        Alert.alert('Registado', 'Cigarro adicionado ao histórico! 💪');
        carregarDadosFumo();
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o registo.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    }
  };

  const totalCigarrosGeral = historico.length;
  const custoTotalGeral = historico.reduce((sum, item) => sum + (parseFloat(item.custo) || 0), 0);

  const hojeStr = new Date().toLocaleDateString('pt-PT');
  const cigarrosHoje = historico.filter(item => 
    new Date(item.dataHora).toLocaleDateString('pt-PT') === hojeStr
  );
  
  const totalCigarrosHoje = cigarrosHoje.length;
  const custoHoje = cigarrosHoje.reduce((sum, item) => sum + (parseFloat(item.custo) || 0), 0);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <FlatList
      data={historico}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Smoke Tracker 🚭</Text>

          {/* AREA DO BOTÃO GIGANTE */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.hugeSmokeButton} onPress={handleFumeiAgora}>
              <Text style={styles.hugeSmokeButtonEmoji}>🚬</Text>
              <Text style={styles.hugeSmokeButtonText}>Fumei 1 Cigarro</Text>
            </TouchableOpacity>
          </View>

          {/* PAINEL DE CONFIGURAÇÃO */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Preço e Maço de Referência</Text>
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Preço do Maço (€)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={precoMaco} onChangeText={setPrecoMaco} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Nº Cigarros</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={qtdMaco} onChangeText={setQtdMaco} />
              </View>
            </View>
          </View>

          {/* QUADROS ESTATÍSTICOS */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#fbebeb' }]}>
              <Text style={styles.statLabel}>Fumados Hoje</Text>
              <Text style={[styles.statValue, { color: '#e63946' }]}>{totalCigarrosHoje}</Text>
              <Text style={styles.statSubText}>Hoje: {custoHoje.toFixed(2)}€</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#f0fbf9' }]}>
              <Text style={styles.statLabel}>Gasto Total Acumulado</Text>
              <Text style={[styles.statValue, { color: '#2ec4b6' }]}>{custoTotalGeral.toFixed(2)}€</Text>
              <Text style={styles.statSubText}>Total: {totalCigarrosGeral} unid.</Text>
            </View>
          </View>

          <Text style={styles.historyTitleText}>Histórico de Consumo</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>Sem registos de fumo.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.historyCard}>
          <View style={styles.historyMeta}>
            <Text style={styles.historyDate}>
              📅 {new Date(item.dataHora).toLocaleDateString('pt-PT')} às {new Date(item.dataHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.historyCost}>-{parseFloat(item.custo).toFixed(2)}€</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 50, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000000', textAlign: 'center' },
  
  // Design do botão gigante centralizado
  buttonContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 25 },
  hugeSmokeButton: { 
    width: 170, 
    height: 170, 
    borderRadius: 85, // Cria o círculo perfeito
    backgroundColor: '#e63946', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8, // Sombra Android
    shadowColor: '#000', // Sombra iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 4,
    borderColor: '#ffffff'
  },
  hugeSmokeButtonEmoji: { fontSize: 42, marginBottom: 5 },
  hugeSmokeButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },

  card: { backgroundColor: '#ffffff', padding: 18, borderRadius: 12, marginBottom: 20, elevation: 2 },
  cardSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 12 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { fontSize: 11, color: '#666', marginBottom: 4, fontWeight: '500' },
  input: { height: 40, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, fontSize: 15, backgroundColor: '#f9f9f9', color: '#000' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, padding: 15, borderRadius: 10, marginRight: 5, elevation: 1 },
  statLabel: { fontSize: 11, color: '#555', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statSubText: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '500' },
  historyTitleText: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginBottom: 12, marginTop: 5 },
  historyCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  historyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 14, color: '#333', fontWeight: '500' },
  historyCost: { fontSize: 14, fontWeight: 'bold', color: '#e63946' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888', fontSize: 14 }
});