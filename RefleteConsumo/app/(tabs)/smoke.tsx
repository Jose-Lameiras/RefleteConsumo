import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SmokeRecord {
  _id: string;
  dataHora: string;
  custo: number;
}

interface TimeSinceLastSmoke {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

export default function SmokeTrackerScreen() {
  const [historico, setHistorico] = useState<SmokeRecord[]>([]);
  const [precoMaco, setPrecoMaco] = useState<string>('5.00');
  const [qtdMaco, setQtdMaco] = useState<string>('20');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeSinceLast, setTimeSinceLast] = useState<TimeSinceLastSmoke>({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [tick, setTick] = useState(0);

  // Atualizar o contador a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateTimeSinceLast = (lastDate: Date): TimeSinceLastSmoke => {
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffSegundos = Math.floor(diffMs / 1000);
    const diffMinutos = Math.floor(diffSegundos / 60);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    return {
      dias: diffDias,
      horas: diffHoras % 24,
      minutos: diffMinutos % 60,
      segundos: diffSegundos % 60,
    };
  };

  const carregarDadosFumo = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      // Buscar configurações de fumo do servidor
      const settingsResponse = await fetch('https://refleteconsumo-api.onrender.com/api/user/smoke-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setPrecoMaco(settingsData.precoMaco);
        setQtdMaco(settingsData.qtdMaco);
      }

      // Buscar histórico de fumo
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/smoke/historico', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistorico(data);

        // Calcular tempo desde o último cigarro
        if (data.length > 0) {
          const lastDate = new Date(data[0].dataHora);
          const timeSpan = calculateTimeSinceLast(lastDate);
          setTimeSinceLast(timeSpan);
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados de fumo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { carregarDadosFumo(); }, []));

  // Recalcular tempo a cada segundo (para atualizar o contador)
  useEffect(() => {
    if (historico.length > 0) {
      const lastDate = new Date(historico[0].dataHora);
      const timeSpan = calculateTimeSinceLast(lastDate);
      setTimeSinceLast(timeSpan);
    }
  }, [tick, historico]);

  const handleFumeiAgora = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Guardar configurações de fumo no MongoDB
      await fetch('https://refleteconsumo-api.onrender.com/api/user/smoke-settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          precoMaco,
          qtdMaco
        })
      });

      // Registar o cigarro
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
        Alert.alert('Registado', 'Lamento saber. Você pode tentar novamente! 💪');
        carregarDadosFumo();
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o registo.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    }
  };

  // Cálculos por período
  const getStatsByPeriod = () => {
    const now = new Date();
    let startDate = new Date();

    if (selectedPeriod === 'dia') {
      startDate.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === 'semana') {
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const filtered = historico.filter(item => {
      const itemDate = new Date(item.dataHora);
      return itemDate >= startDate;
    });

    const totalCigarros = filtered.length;
    const totalCusto = filtered.reduce((sum, item) => sum + (item.custo || 0), 0);

    return { totalCigarros, totalCusto };
  };

  const periodStats = getStatsByPeriod();
  const totalCigarrosGeral = historico.length;
  const custoTotalGeral = historico.reduce((sum, item) => sum + (item.custo || 0), 0);
  const precoCigarro = parseFloat(precoMaco) / parseInt(qtdMaco);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Smoke Tracker 🚭</Text>

      {/* CONTADOR DE TEMPO DESDE O ÚLTIMO CIGARRO */}
      {historico.length > 0 && (
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>⏱️ Tempo desde o último cigarro</Text>
          <View style={styles.timerContent}>
            <View style={styles.timerUnit}>
              <Text style={styles.timerValue}>{timeSinceLast.dias}</Text>
              <Text style={styles.timerUnitLabel}>Dias</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerUnit}>
              <Text style={styles.timerValue}>{String(timeSinceLast.horas).padStart(2, '0')}</Text>
              <Text style={styles.timerUnitLabel}>Horas</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerUnit}>
              <Text style={styles.timerValue}>{String(timeSinceLast.minutos).padStart(2, '0')}</Text>
              <Text style={styles.timerUnitLabel}>Min</Text>
            </View>
          </View>
          <Text style={styles.timerMessage}>
            {timeSinceLast.dias > 0
              ? `Parabéns! Está a fazer progresso! 🎉`
              : `Continue firme, você consegue! 💪`}
          </Text>
        </View>
      )}

      {/* AREA DO BOTÃO GIGANTE */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.hugeSmokeButton} onPress={handleFumeiAgora}>
          <Text style={styles.hugeSmokeButtonEmoji}>🚬</Text>
          <Text style={styles.hugeSmokeButtonText}>Registar Cigarro</Text>
        </TouchableOpacity>
      </View>

      {/* PAINEL DE CONFIGURAÇÃO */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>⚙️ Preço e Maço de Referência</Text>
        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.inputLabel}>Preço do Maço (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={precoMaco}
              onChangeText={setPrecoMaco}
              placeholder="5.00"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Nº Cigarros no Maço</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={qtdMaco}
              onChangeText={setQtdMaco}
              placeholder="20"
            />
          </View>
        </View>
        <Text style={styles.calcInfo}>
          Preço por cigarro: {precoCigarro.toFixed(3)}€
        </Text>
      </View>

      {/* SELETOR DE PERÍODO */}
      <View style={styles.periodSelector}>
        {(['dia', 'semana', 'mes'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'dia' ? 'Hoje' : period === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* QUADROS ESTATÍSTICOS */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#fbebeb' }]}>
          <Text style={styles.statLabel}>
            {selectedPeriod === 'dia'
              ? 'Fumados Hoje'
              : selectedPeriod === 'semana'
                ? 'Fumados Esta Semana'
                : 'Fumados Este Mês'}
          </Text>
          <Text style={[styles.statValue, { color: '#e63946' }]}>
            {periodStats.totalCigarros}
          </Text>
          <Text style={styles.statSubText}>
            Gasto: {periodStats.totalCusto.toFixed(2)}€
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f0fbf9' }]}>
          <Text style={styles.statLabel}>Total Acumulado</Text>
          <Text style={[styles.statValue, { color: '#2ec4b6' }]}>
            {custoTotalGeral.toFixed(2)}€
          </Text>
          <Text style={styles.statSubText}>{totalCigarrosGeral} unidades</Text>
        </View>
      </View>

      {/* HISTÓRICO */}
      {historico.length > 0 && (
        <View>
          <Text style={styles.historyTitleText}>📋 Últimos Registos</Text>
          {historico.slice(0, 10).map((item) => (
            <View key={item._id} style={styles.historyCard}>
              <Text style={styles.historyDate}>
                📅 {new Date(item.dataHora).toLocaleDateString('pt-PT')} às{' '}
                {new Date(item.dataHora).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.historyCost}>Custo: -{item.custo.toFixed(3)}€</Text>
            </View>
          ))}
        </View>
      )}

      {historico.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>Nenhum registo de fumo!</Text>
          <Text style={styles.emptySubtext}>
            Bem-vindo a uma vida mais saudável
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
    textAlign: 'center',
  },

  // Timer Card
  timerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e63946',
    elevation: 3,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerUnit: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e63946',
  },
  timerUnitLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  timerSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ccc',
    marginHorizontal: 4,
  },
  timerMessage: {
    textAlign: 'center',
    fontSize: 13,
    color: '#2ec4b6',
    fontWeight: '600',
  },

  // Design do botão gigante centralizado
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  hugeSmokeButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#e63946',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  hugeSmokeButtonEmoji: {
    fontSize: 42,
    marginBottom: 5,
  },
  hugeSmokeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  calcInfo: {
    fontSize: 12,
    color: '#2ec4b6',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  historyTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    marginTop: 5,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  historyCost: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e63946',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
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