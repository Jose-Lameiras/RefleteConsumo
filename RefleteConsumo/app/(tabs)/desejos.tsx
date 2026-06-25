import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function TabTwoScreen() {
  const [desejos, setDesejos] = useState<any[]>([]);
  const [salarioMensal, setSalarioMensal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0); // Força o ecrã a atualizar a contagem a cada segundo
  const HORAS_TRABALHO_DIA = 8;
  const DIAS_TRABALHO_MES = 22;

  const buildMoodKey = (nome: string, precoValor: number, categoriaValor: string, dataLiberacaoISO: string) => {
    const nomeKey = (nome || '').trim().toLowerCase();
    const precoKey = Number.isFinite(precoValor) ? precoValor.toFixed(2) : '0.00';
    const categoriaKey = (categoriaValor || '').trim().toLowerCase();
    return `${nomeKey}|${precoKey}|${categoriaKey}|${dataLiberacaoISO}`;
  };

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
      const [desejosResponse, perfilResponse] = await Promise.all([
        fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://refleteconsumo-api.onrender.com/api/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (!desejosResponse.ok) throw new Error('Erro na API');

      const data = await desejosResponse.json();
      const rawMoodMap = await AsyncStorage.getItem('desireMoodMap');
      const moodMap = rawMoodMap ? JSON.parse(rawMoodMap) : {};

      // Keep only active wishes in this screen. Bought goes to Gastos and canceled is removed.
      const desejosAtivos = (Array.isArray(data) ? data : []).filter(
        (item) => item.status !== 'comprado' && item.status !== 'descartado'
      );

      const desejosComMoodFallback = desejosAtivos.map((item) => {
        const categoriaItem = item.categoria || item.category || '';
        const precoItem = parseFloat(String(item.preco).replace(',', '.')) || 0;
        const dataLiberacaoISO = item.dataLiberacao ? new Date(item.dataLiberacao).toISOString() : '';
        const moodKey = buildMoodKey(item.nome || '', precoItem, categoriaItem, dataLiberacaoISO);
        const moodFallback = moodMap[moodKey];

        if (item.estadoEspirito || item.estadoDeEspirito || item.mood || !moodFallback) {
          return item;
        }

        return { ...item, estadoEspirito: moodFallback };
      });

      setDesejos(desejosComMoodFallback);

      if (perfilResponse.ok) {
        const perfilData = await perfilResponse.json();
        const salario = parseFloat(perfilData?.salario);
        if (!isNaN(salario) && salario > 0) {
          setSalarioMensal(salario);
        } else {
          setSalarioMensal(null);
        }
      } else {
        setSalarioMensal(null);
      }
    } catch (error) {
      console.log("Erro na busca:", error);
      Alert.alert('Erro', 'Não consegui ligar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularHorasParaCompra = (precoProduto: number) => {
    if (!salarioMensal || salarioMensal <= 0 || precoProduto <= 0) {
      return null;
    }

    const ganhoHora = salarioMensal / (DIAS_TRABALHO_MES * HORAS_TRABALHO_DIA);
    if (ganhoHora <= 0) {
      return null;
    }

    return precoProduto / ganhoHora;
  };

  useFocusEffect(useCallback(() => { buscarDesejos(); }, []));

  const marcarRefletidoLocalmente = (desejoId: string) => {
    setDesejos((prev) =>
      prev.map((item) =>
        item._id === desejoId ? { ...item, jaRefletiu: true } : item
      )
    );
  };

  const confirmarReflexaoNoServidor = async (desejoId: string) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos/refletir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ desejoId }),
    });

    return response;
  };

  // Envia a decisão de comprar ou cancelar para o Servidor
  const handleDecidir = async (desejoId: string, comprar: boolean) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      let response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos/decidir', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ desejoId, comprar }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = String(errorData?.error || '');

        // Se o backend exigir confirmação de reflexão, confirma e tenta decidir de novo.
        if (errorMessage.toLowerCase().includes('refleti')) {
          const refletirResponse = await confirmarReflexaoNoServidor(desejoId);
          if (refletirResponse.ok) {
            marcarRefletidoLocalmente(desejoId);
            response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos/decidir', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ desejoId, comprar }),
            });
          }
        }
      }

      if (response.ok) {
        if (!comprar) {
          // Remove canceled wish immediately from UI.
          setDesejos((prev) => prev.filter((item) => item._id !== desejoId));
        }

        Alert.alert(
          'Sucesso!', 
          comprar ? 'Item comprado e enviado para os gastos! 💰' : 'Guardado como Desejo não comprado! ❌'
        );
        buscarDesejos(); // Recarrega a lista para atualizar o ecrã na hora
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Erro', errorData.error || 'Não foi possível processar a tua decisão.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na ligação ao servidor.');
    }
  };

  const handleJaRefleti = async (desejoId: string) => {
    // Desbloqueia imediatamente no UI para evitar fricção ao utilizador.
    marcarRefletidoLocalmente(desejoId);

    try {
      const response = await confirmarReflexaoNoServidor(desejoId);

      if (response.ok) {
        Alert.alert('Success', 'Reflection confirmed. You can now buy this product.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Warning', errorData.error || 'Reflection was unlocked locally. Server confirmation failed.');
      }
    } catch (error) {
      Alert.alert('Warning', 'Reflection was unlocked locally. Server is currently unavailable.');
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
            const jaTerminou = item.dataLiberacao
              ? new Date(item.dataLiberacao).getTime() - new Date().getTime() <= 0
              : false;
            const podeDecidir = item.status === 'em_reflexao' || item.status === 'ultrapassado';
            const jaRefletiu = !!item.jaRefletiu || jaTerminou;
            const categoria = item.categoria || item.category || 'Outros';
            const estadoEspirito = item.estadoEspirito || item.estadoDeEspirito || item.mood || 'Não definido';
            const precoItem = parseFloat(String(item.preco).replace(',', '.')) || 0;
            const horasNecessarias = calcularHorasParaCompra(precoItem);

            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text style={styles.cardInfo}>💰 {item.preco}€</Text>
                <Text style={styles.cardInfo}>📂 Categoria: {categoria}</Text>
                <Text style={styles.cardInfo}>🙂 Estado: {estadoEspirito}</Text>
                {horasNecessarias !== null ? (
                  <Text style={styles.workHoursText}>
                    🕒 Precisa de {horasNecessarias.toFixed(1)}h de trabalho para comprar
                  </Text>
                ) : (
                  <Text style={styles.workHoursHint}>
                    💬 Defina o salário no Perfil para calcular horas de trabalho
                  </Text>
                )}
                
                <Text style={{ marginTop: 5, color: '#666', fontWeight: '500' }}>
                  Status: {item.status === 'em_reflexao' ? 'Em reflexão' : item.status === 'ultrapassado' ? 'Ultrapassado' : item.status}
                </Text>

                {item.status === 'em_reflexao' && item.dataLiberacao && (
                  <Text style={[
                    styles.cooldownText, 
                    jaTerminou && styles.readyText
                  ]}>
                    ⏳ {obtenerContagemDecrescente(item.dataLiberacao)}
                  </Text>
                )}

                {item.status === 'em_reflexao' && !jaRefletiu && (
                  <TouchableOpacity
                    style={styles.reflectButton}
                    onPress={() => handleJaRefleti(item._id)}
                  >
                    <Text style={styles.btnText}>Já refleti</Text>
                  </TouchableOpacity>
                )}

                {/* Botões de Ação: Só aparecem após o utilizador confirmar que já refletiu */}
                {podeDecidir && jaRefletiu && (
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
  workHoursText: { color: '#1f7a8c', marginTop: 5, fontWeight: '600' },
  workHoursHint: { color: '#6c757d', marginTop: 5, fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
  cooldownText: { fontSize: 13, color: '#e63946', marginTop: 6, fontWeight: 'bold' },
  readyText: { color: '#2ec4b6', marginBottom: 5 },
  reflectButton: { backgroundColor: '#457b9d', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  buyButton: { backgroundColor: '#2ec4b6', flex: 1, marginRight: 6, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e63946', flex: 1, marginLeft: 6, paddingVertical: 10, borderRadius: 6, alignItems: 'center' }, // Botão de Cancelar Vermelho
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});