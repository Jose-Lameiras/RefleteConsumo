import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GastosScreen() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [inputBudget, setInputBudget] = useState<string>('');
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setTick] = useState<number>(0);

  // Força uma atualização leve a cada 30 segundos para manter os cálculos frescos
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarPainelFinanceiro = async () => {
    try {
      setIsLoading(true);
      
      // 1. Buscar Budget guardado localmente
      const budgetGuardado = await AsyncStorage.getItem('userBudget');
      if (budgetGuardado) {
        setBudget(parseFloat(budgetGuardado));
        setInputBudget(budgetGuardado);
      } else {
        setBudget(0);
        setInputBudget('0');
      }

      // 2. Buscar itens comprados no Backend
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/gastos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Erro na API de gastos');
      
      const data = await response.json();
      setGastos(data);
    } catch (error) {
      console.log("Erro ao carregar gastos:", error);
      Alert.alert('Erro', 'Não foi possível atualizar o painel financeiro.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { carregarPainelFinanceiro(); }, []));

  const handleGuardarBudget = async () => {
    const valorNum = parseFloat(inputBudget.replace(',', '.'));
    if (isNaN(valorNum) || valorNum < 0) {
      return Alert.alert('Erro', 'Por favor, introduz um valor válido para o orçamento.');
    }
    
    await AsyncStorage.setItem('userBudget', valorNum.toString());
    setBudget(valorNum);
    setIsEditingBudget(false);
    Alert.alert('Sucesso', 'Orçamento mensal atualizado!');
  };

  // --- CÁLCULOS DOS GRÁFICOS E ESTATÍSTICAS ---
  const totalGasto = gastos.reduce((sum, item) => sum + (parseFloat(item.preco) || 0), 0);
  const restante = budget - totalGasto;
  const percentagemUso = budget > 0 ? (totalGasto / budget) * 100 : 0;
  const larguraProgresso = Math.min(100, percentagemUso); // Garante que a barra não passa dos 100% visuais

  const obterCorProgresso = () => {
    if (percentagemUso >= 100) return '#e63946'; // Vermelho (Orçamento Estourado)
    if (percentagemUso >= 80) return '#f4a261';  // Laranja (Aviso Limite)
    return '#2ec4b6';                            // Verde (Seguro)
  };

  const obterGastosPorCategoria = () => {
    const categorias: { [key: string]: number } = {};
    gastos.forEach(item => {
      const cat = item.categoria || 'Outros';
      categorias[cat] = (categorias[cat] || 0) + (parseFloat(item.preco) || 0);
    });

    return Object.keys(categorias).map(cat => ({
      nome: cat,
      total: categorias[cat],
      percentagem: totalGasto > 0 ? (categorias[cat] / totalGasto) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  };

  const dadosCategorias = obterGastosPorCategoria();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2ec4b6" />
      </View>
    );
  }

  // Estrutura principal utilizando a FlatList como base para evitar conflitos de Scroll
  return (
    <FlatList
      data={gastos}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Painel de Gastos</Text>

          {/* SECÇÃO DO BUDGET / ORÇAMENTO */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Orçamento Mensal Definido</Text>
            {isEditingBudget ? (
              <View style={styles.budgetEditRow}>
                <TextInput
                  style={styles.budgetInput}
                  keyboardType="numeric"
                  value={inputBudget}
                  onChangeText={setInputBudget}
                  placeholder="0.00"
                />
                <TouchableOpacity style={styles.saveBudgetBtn} onPress={handleGuardarBudget}>
                  <Text style={styles.btnText}>Ok</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.budgetDisplayRow}>
                <Text style={styles.budgetValue}>{budget.toFixed(2)}€</Text>
                <TouchableOpacity style={styles.editBudgetBtn} onPress={() => setIsEditingBudget(true)}>
                  <Text style={styles.editBudgetBtnText}>Alterar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* GRÁFICO 1: Barra de Progresso do Orçamento */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${larguraProgresso}%`, backgroundColor: obterCorProgresso() }]} />
            </View>

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statSub}>Total Gasto</Text>
                <Text style={styles.statGastoVal}>{totalGasto.toFixed(2)}€</Text>
              </View>
              <View style={{ alignItems: 'end' }}>
                <Text style={styles.statSub}>Disponível</Text>
                <Text style={[styles.statRestanteVal, restante < 0 && { color: '#e63946' }]}>
                  {restante.toFixed(2)}€
                </Text>
              </View>
            </View>
          </View>

          {/* GRÁFICO 2: Distribuição Dinâmica por Categoria */}
          <View style={styles.card}>
            <Text style={styles.sectionSubtitle}>Gastos por Categoria</Text>
            {dadosCategorias.length === 0 ? (
              <Text style={styles.noDataText}>Sem dados de categorias disponíveis.</Text>
            ) : (
              dadosCategorias.map((item, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryMeta}>
                    <Text style={styles.categoryName}>{item.nome}</Text>
                    <Text style={styles.categoryAmount}>{item.total.toFixed(2)}€ ({item.percentagem.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View style={[styles.categoryBar, { width: `${item.percentagem}%` }]} />
                  </View>
                </View>
              ))
            )}
          </View>

          <Text style={styles.sectionSubtitleList}>Histórico de Compras Reflexivas</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>Ainda não efetuaste nenhuma compra baseada nos teus desejos.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>{item.nome}</Text>
            <Text style={styles.historyPrice}>-{parseFloat(item.preco).toFixed(2)}€</Text>
          </View>
          <Text style={styles.historyMeta}>📂 {item.categoria || 'Geral'} | ✔️ Status: Comprado</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f8f9fa', paddingTop: 50, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000000' },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardLabel: { fontSize: 13, color: '#666666', fontWeight: '500', marginBottom: 5 },
  budgetDisplayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  budgetValue: { fontSize: 28, fontWeight: 'bold', color: '#000000' },
  editBudgetBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editBudgetBtnText: { fontSize: 13, color: '#333333', fontWeight: '600' },
  budgetEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  budgetInput: { flex: 1, height: 45, borderWidth: 1, borderColor: '#cccccc', borderRadius: 8, paddingHorizontal: 10, fontSize: 18, backgroundColor: '#f9f9f9', marginRight: 8 },
  saveBudgetBtn: { backgroundColor: '#000000', height: 45, width: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: 'bold' },
  
  // Estilo do Gráfico de Progresso
  progressContainer: { height: 10, backgroundColor: '#e9ecef', borderRadius: 5, overflow: 'hidden', marginBottom: 15 },
  progressBar: { height: '100%', borderRadius: 5 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f3f5', paddingTop: 12 },
  statSub: { fontSize: 12, color: '#666666', marginBottom: 2 },
  statGastoVal: { fontSize: 16, fontWeight: '600', color: '#000000' },
  statRestanteVal: { fontSize: 16, fontWeight: '600', color: '#2ec4b6' },
  
  // Estilos do Gráfico de Categorias
  sectionSubtitle: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginBottom: 15 },
  noDataText: { color: '#888888', textAlign: 'center', marginVertical: 10, fontSize: 13 },
  categoryRow: { marginBottom: 14 },
  categoryMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: 14, fontWeight: '500', color: '#333333' },
  categoryAmount: { fontSize: 13, color: '#666666', fontWeight: '500' },
  categoryBarContainer: { height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' },
  categoryBar: { height: '100%', backgroundColor: '#264653', borderRadius: 4 },
  
  // Histórico
  sectionSubtitleList: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginTop: 10, marginBottom: 15 },
  historyCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 16, fontWeight: '600', color: '#000000' },
  historyPrice: { fontSize: 16, fontWeight: 'bold', color: '#e63946' },
  historyMeta: { fontSize: 12, color: '#666666', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888888', fontSize: 14 }
});