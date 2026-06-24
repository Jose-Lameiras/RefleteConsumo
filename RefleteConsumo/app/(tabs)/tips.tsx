import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

interface DailyTip {
  _id?: string;
  texto: string;
  categoria?: string;
  dataCriacao?: string;
}

type TabType = 'daily' | 'saved';

export default function TipsScreen() {
  const [currentTab, setCurrentTab] = useState<TabType>('daily');
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [allTips, setAllTips] = useState<DailyTip[]>([]);
  const [savedTips, setSavedTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadTips();
    }, [])
  );

  const loadTips = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      // Carregar dica do dia a partir da base de dados
      const dailyResponse = await fetch('https://refleteconsumo-api.onrender.com/api/daily-tips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json();
        setDailyTip(dailyData);
      } else {
        setDailyTip(null);
      }

      // Carregar todas as dicas
      const allResponse = await fetch('https://refleteconsumo-api.onrender.com/api/daily-tips/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (allResponse.ok) {
        const allData = await allResponse.json();
        console.log('📚 Total dicas:', Array.isArray(allData) ? allData.length : 0, allData);
        setAllTips(Array.isArray(allData) ? allData : []);
      } else {
        console.error('Erro dicas:', allResponse.status);
        setAllTips([]);
      }

      // Carregar dicas guardadas
      const saved = await AsyncStorage.getItem('savedTips');
      if (saved) {
        setSavedTips(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar dicas:', error);
      setAllTips([]);
      setDailyTip(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTip = async (tipId: string) => {
    try {
      let updatedSaved = [...savedTips];
      if (updatedSaved.includes(tipId)) {
        updatedSaved = updatedSaved.filter((id) => id !== tipId);
      } else {
        updatedSaved.push(tipId);
      }
      setSavedTips(updatedSaved);
      await AsyncStorage.setItem('savedTips', JSON.stringify(updatedSaved));
      Alert.alert('Sucesso', 'Dica guardada!' );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar a dica.');
    }
  };

  const handleShareTip = async (tip: DailyTip) => {
    try {
      await Share.share({
        message: `${tip.texto}\n\n- RefleteConsumo`,
        title: 'Dica RefleteConsumo',
      });
    } catch (error) {
      console.error('Erro ao partilhar:', error);
    }
  };

  const handleDeleteTip = async (tipId: string) => {
    Alert.alert('Remover', 'Tem a certeza que quer remover esta dica?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Remover',
        onPress: async () => {
          const updatedSaved = savedTips.filter((id) => id !== tipId);
          setSavedTips(updatedSaved);
          await AsyncStorage.setItem('savedTips', JSON.stringify(updatedSaved));
        },
      },
    ]);
  };

  const renderTipCard = (tip: DailyTip, isSaved: boolean = false) => (
    <View style={[styles.tipCard, isSaved && styles.tipCardSaved]}>
      <View style={styles.tipHeader}>
        <View style={styles.tipHeaderLeft}>
          <View
            style={[
              styles.tipBadge,
              tip.categoria === 'reflexao'
                ? styles.reflexaoBadge
                : tip.categoria === 'tecnica'
                  ? styles.tecnicaBadge
                  : tip.categoria === 'historica'
                    ? styles.historicaBadge
                    : styles.inspiracaoBadge,
            ]}
          >
            <Text style={styles.tipBadgeText}>
              {tip.categoria === 'reflexao'
                ? '💭'
                : tip.categoria === 'tecnica'
                  ? '⚙️'
                  : tip.categoria === 'historica'
                    ? '📚'
                    : '✨'}
            </Text>
          </View>
          <Text style={styles.tipTitle}>Dica</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleSaveTip(tip._id || '')}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>
            {savedTips.includes(tip._id || '') ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tipConteudo}>{tip.texto}</Text>

      <View style={styles.tipFooter}>
        <TouchableOpacity
          style={styles.tipActionButton}
          onPress={() => handleShareTip(tip)}
        >
          <Text style={styles.tipActionText}>📤 Partilhar</Text>
        </TouchableOpacity>
        {isSaved && (
          <TouchableOpacity
            style={styles.tipActionButton}
            onPress={() => handleDeleteTip(tip._id || '')}
          >
            <Text style={styles.tipActionText}>🗑️ Remover</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const savedTipsData = allTips.filter((tip) => savedTips.includes(tip._id || ''));

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2ec4b6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'daily' && styles.tabActive]}
          onPress={() => setCurrentTab('daily')}
        >
          <Text style={styles.tabText}>Dica do Dia</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'saved' && styles.tabActive]}
          onPress={() => setCurrentTab('saved')}
        >
          <Text style={styles.tabText}>
            Guardadas ({savedTips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content}>
        {currentTab === 'daily' && (
          <View>
            {dailyTip && dailyTip.texto ? (
              <View>
                <Text style={styles.dailyLabel}>✨ Dica do Dia ✨</Text>
                {renderTipCard(dailyTip, savedTips.includes(dailyTip._id || ''))}
                <Text style={styles.dailyInfo}>
                  Uma nova dica diária aparece todos os dias!
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏰</Text>
                <Text style={styles.emptyText}>Carregando dica do dia...</Text>
              </View>
            )}
          </View>
        )}

        {currentTab === 'saved' && (
          <View>
            {savedTipsData.length > 0 ? (
              <FlatList
                data={savedTipsData}
                renderItem={({ item }) => renderTipCard(item, true)}
                keyExtractor={(item) => item._id || ''}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>Nenhuma dica guardada</Text>
                <Text style={styles.emptySubtext}>
                  Guarde dicas para consultá-las mais tarde
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  content: {
    flex: 1,
    padding: 16,
  },
  dailyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ec4b6',
    textAlign: 'center',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tipCardSaved: {
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reflexaoBadge: {
    backgroundColor: '#f0f8ff',
  },
  tecnicaBadge: {
    backgroundColor: '#f0f0f0',
  },
  historicaBadge: {
    backgroundColor: '#fff5e6',
  },
  inspiracaoBadge: {
    backgroundColor: '#ffe6f0',
  },
  tipBadgeText: {
    fontSize: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  saveButton: {
    paddingLeft: 12,
  },
  saveButtonText: {
    fontSize: 24,
  },
  tipConteudo: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 12,
  },
  tipFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  tipActionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tipActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  dailyInfo: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic',
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
