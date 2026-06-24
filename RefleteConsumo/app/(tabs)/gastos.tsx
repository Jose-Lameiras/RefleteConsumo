import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GastosChart } from '@/components/charts';

type ViewMode = 'resumo' | 'graficos' | 'historico';
type DateFilterMode = 'todos' | 'hoje' | '7dias' | '30dias' | 'mesAtual';

export default function GastosScreen() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [inputBudget, setInputBudget] = useState<string>('');
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('resumo');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterMode>('todos');
  const [, setTick] = useState<number>(0);

  // Força uma atualização leve a cada 30 segundos para manter os cálculos frescos
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarPainelFinanceiro = async () => {
    try {
      setIsLoading(true);
      
      // Buscar Budget do servidor (MongoDB)
      const token = await AsyncStorage.getItem('userToken');
      const budgetResponse = await fetch('https://refleteconsumo-api.onrender.com/api/user/budget', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json();
        setBudget(budgetData.budget);
        setInputBudget(budgetData.budget.toString());
      }

      // 2. Buscar itens comprados no Backend
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
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/user/budget', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ budget: valorNum })
      });
      
      if (!response.ok) throw new Error('Erro ao guardar orçamento');
      
      setBudget(valorNum);
      setIsEditingBudget(false);
      Alert.alert('Sucesso', 'Orçamento mensal atualizado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar o orçamento.');
    }
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isWithinDateFilter = (rawDate: string) => {
    const itemDate = new Date(rawDate);
    if (Number.isNaN(itemDate.getTime())) return false;

    if (selectedDateFilter === 'todos') return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    if (selectedDateFilter === 'hoje') {
      return isSameDay(itemDay, today);
    }

    if (selectedDateFilter === '7dias' || selectedDateFilter === '30dias') {
      const days = selectedDateFilter === '7dias' ? 7 : 30;
      const start = new Date(today);
      start.setDate(start.getDate() - (days - 1));
      return itemDay >= start && itemDay <= today;
    }

    if (selectedDateFilter === 'mesAtual') {
      return itemDay.getFullYear() === today.getFullYear() && itemDay.getMonth() === today.getMonth();
    }

    return true;
  };

  const categoriasDisponiveis = Array.from(
    new Set(
      gastos
        .map((item) => (item.categoria || item.category || 'Outros').trim())
        .filter((cat) => cat.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  const gastosFiltrados = gastos.filter((item) => {
    const categoriaItem = item.categoria || item.category || 'Outros';
    const categoryMatch = selectedCategory === 'Todos' || categoriaItem === selectedCategory;
    const dateMatch = isWithinDateFilter(item.dataRegisto);
    return categoryMatch && dateMatch;
  });

  // --- CÁLCULOS DOS GRÁFICOS E ESTATÍSTICAS ---
  const totalGasto = gastosFiltrados.reduce((sum, item) => sum + (parseFloat(item.preco) || 0), 0);
  const restante = budget - totalGasto;
  const percentagemUso = budget > 0 ? (totalGasto / budget) * 100 : 0;
  const larguraProgresso = Math.min(100, percentagemUso);

  const obterCorProgresso = () => {
    if (percentagemUso >= 100) return '#e63946';
    if (percentagemUso >= 80) return '#f4a261';
    return '#2ec4b6';
  };

  const obterGastosPorCategoria = () => {
    const categorias: { [key: string]: number } = {};
    gastosFiltrados.forEach(item => {
      const cat = item.categoria || item.category || 'Outros';
      categorias[cat] = (categorias[cat] || 0) + (parseFloat(item.preco) || 0);
    });

    return Object.keys(categorias).map(cat => ({
      nome: cat,
      total: categorias[cat],
      percentagem: totalGasto > 0 ? (categorias[cat] / totalGasto) * 100 : 0
    })).sort((a, b) => b.total - a.total);
  };

  // Preparar dados para gráfico de pizza
  const prepararDadosPizza = () => {
    const categorias = obterGastosPorCategoria();
    const cores = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#d62828'];
    
    return categorias.map((categoria, index) => ({
      name: categoria.nome,
      population: categoria.total,
      color: cores[index % cores.length],
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  };

  // Preparar dados para gráfico de linha (últimos 7 dias)
  const prepararDadosLinha = () => {
    const hoje = new Date();
    const ultimos7dias: { [key: string]: number } = {};
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const chave = data.toLocaleDateString('pt-PT', { month: '2-digit', day: '2-digit' });
      ultimos7dias[chave] = 0;
    }

    gastosFiltrados.forEach(item => {
      const itemData = new Date(item.dataRegisto);
      const chave = itemData.toLocaleDateString('pt-PT', { month: '2-digit', day: '2-digit' });
      if (chave in ultimos7dias) {
        ultimos7dias[chave] += parseFloat(item.preco) || 0;
      }
    });

    return {
      labels: Object.keys(ultimos7dias),
      datasets: [
        {
          data: Object.values(ultimos7dias),
        },
      ],
    };
  };

  const dadosCategorias = obterGastosPorCategoria();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2ec4b6" />
      </View>
    );
  }

  // Renderizar conteúdo por modo de visualização
  const renderContent = () => {
    if (viewMode === 'graficos') {
      return (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Visualizações</Text>
          
            {gastosFiltrados.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>Gastos por Categoria</Text>
              <GastosChart
                type="pie"
                data={prepararDadosPizza()}
              />
              
              <Text style={styles.sectionSubtitle}>Gastos Últimos 7 Dias</Text>
              <GastosChart
                type="line"
                data={prepararDadosLinha()}
              />
            </>
          )}

          {gastosFiltrados.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>Sem dados para visualizar</Text>
              <Text style={styles.emptySubtext}>Ajuste os filtros ou registe novas compras</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      );
    }

    if (viewMode === 'historico') {
      return (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Histórico de Compras</Text>
          
          {gastosFiltrados.length > 0 ? (
            gastosFiltrados.map((item) => (
              <View key={item._id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>{item.nome}</Text>
                  <Text style={styles.historyPrice}>-{parseFloat(item.preco).toFixed(2)}€</Text>
                </View>
                <Text style={styles.historyMeta}>
                  📂 {item.categoria || item.category || 'Geral'} | 📅 {new Date(item.dataRegisto).toLocaleDateString('pt-PT')}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Nenhuma compra registada</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      );
    }

    // viewMode === 'resumo'
    return (
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${larguraProgresso}%`, backgroundColor: obterCorProgresso() }]} />
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statSub}>Total Gasto</Text>
              <Text style={styles.statGastoVal}>{totalGasto.toFixed(2)}€</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statSub}>Disponível</Text>
              <Text style={[styles.statRestanteVal, restante < 0 && { color: '#e63946' }]}>
                {restante.toFixed(2)}€
              </Text>
            </View>
          </View>
        </View>

        {/* GASTOS POR CATEGORIA */}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs de Visualização */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'resumo' && styles.tabActive]}
          onPress={() => setViewMode('resumo')}
        >
          <Text style={styles.tabText}>Resumo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'graficos' && styles.tabActive]}
          onPress={() => setViewMode('graficos')}
        >
          <Text style={styles.tabText}>Gráficos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'historico' && styles.tabActive]}
          onPress={() => setViewMode('historico')}
        >
          <Text style={styles.tabText}>Histórico</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Filtrar por categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'Todos' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('Todos')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'Todos' && styles.filterChipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {categoriasDisponiveis.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Filtrar por data</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedDateFilter === 'todos' && styles.filterChipActive]}
            onPress={() => setSelectedDateFilter('todos')}
          >
            <Text style={[styles.filterChipText, selectedDateFilter === 'todos' && styles.filterChipTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDateFilter === 'hoje' && styles.filterChipActive]}
            onPress={() => setSelectedDateFilter('hoje')}
          >
            <Text style={[styles.filterChipText, selectedDateFilter === 'hoje' && styles.filterChipTextActive]}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDateFilter === '7dias' && styles.filterChipActive]}
            onPress={() => setSelectedDateFilter('7dias')}
          >
            <Text style={[styles.filterChipText, selectedDateFilter === '7dias' && styles.filterChipTextActive]}>7 dias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDateFilter === '30dias' && styles.filterChipActive]}
            onPress={() => setSelectedDateFilter('30dias')}
          >
            <Text style={[styles.filterChipText, selectedDateFilter === '30dias' && styles.filterChipTextActive]}>30 dias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedDateFilter === 'mesAtual' && styles.filterChipActive]}
            onPress={() => setSelectedDateFilter('mesAtual')}
          >
            <Text style={[styles.filterChipText, selectedDateFilter === 'mesAtual' && styles.filterChipTextActive]}>Mês atual</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingTop: 50,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#2ec4b6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  filterScroll: {
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2ec4b6',
    borderColor: '#2ec4b6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 5,
  },
  budgetDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  editBudgetBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editBudgetBtnText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
  },
  budgetEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  saveBudgetBtn: {
    backgroundColor: '#000000',
    height: 45,
    width: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 12,
  },
  statSub: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  statGastoVal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statRestanteVal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ec4b6',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  noDataText: {
    color: '#888888',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 13,
  },
  categoryRow: {
    marginBottom: 14,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  categoryAmount: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  categoryBarContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    backgroundColor: '#264653',
    borderRadius: 4,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e63946',
  },
  historyMeta: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});