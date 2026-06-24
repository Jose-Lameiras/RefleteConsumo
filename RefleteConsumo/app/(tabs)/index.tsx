import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HomeScreen() {
  const buildMoodKey = (nome: string, precoValor: number, categoriaValor: string, dataLiberacaoISO: string) => {
    const nomeKey = (nome || '').trim().toLowerCase();
    const precoKey = Number.isFinite(precoValor) ? precoValor.toFixed(2) : '0.00';
    const categoriaKey = (categoriaValor || '').trim().toLowerCase();
    return `${nomeKey}|${precoKey}|${categoriaKey}|${dataLiberacaoISO}`;
  };

  const salvarEstadoEspiritoLocal = async (nome: string, precoValor: number, categoriaValor: string, dataLiberacaoISO: string, mood: string) => {
    try {
      const key = buildMoodKey(nome, precoValor, categoriaValor, dataLiberacaoISO);
      const raw = await AsyncStorage.getItem('desireMoodMap');
      const currentMap = raw ? JSON.parse(raw) : {};
      currentMap[key] = mood;
      await AsyncStorage.setItem('desireMoodMap', JSON.stringify(currentMap));
    } catch {
      // Fallback silencioso: o desejo continua a ser guardado no servidor.
    }
  };

  const buildReleaseDateFromDay = (selectedDay: Date) => {
    // Always rebuild from scratch to avoid carrying previous date/time state.
    const result = new Date();
    result.setFullYear(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
    result.setHours(23, 59, 0, 0);
    return result;
  };

  const getDefaultReflectionDate = () => {
    const base = new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(23, 59, 0, 0);
    return base;
  };

  const [nomeItem, setNomeItem] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estadoEspirito, setEstadoEspirito] = useState('');
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [dataAlvo, setDataAlvo] = useState(getDefaultReflectionDate());
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(getDefaultReflectionDate());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const opcoesEstadoEspirito = ['Calmo', 'Ansioso', 'Entusiasmado', 'Stressado', 'Triste'];

  const gerarOpcoesDiasWeb = (totalDias: number = 90) => {
    const hoje = new Date();
    const dias: Date[] = [];

    for (let i = 0; i < totalDias; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      d.setHours(23, 59, 0, 0);
      dias.push(d);
    }

    return dias;
  };

  const handleReflectionDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const abrirCalendario = () => {
    setTempDate(dataAlvo);
    setShowDateModal(true);
  };

  const confirmarDataReflexao = () => {
    setDataAlvo(buildReleaseDateFromDay(tempDate));
    setShowDateModal(false);
  };

  const carregarCategorias = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return;

      const desejos = await response.json();
      const categoriasUnicas = Array.from(
        new Set(
          desejos
            .map((item: any) => item.categoria || item.category)
            .filter((cat: string | undefined) => !!cat)
            .map((cat: string) => cat.trim())
            .filter((cat: string) => cat.length > 0)
        )
      ) as string[];

      setCategoriasExistentes(categoriasUnicas);
    } catch (error) {
      // Se falhar, mantém fluxo manual de categoria sem bloquear criação de desejo.
      setCategoriasExistentes([]);
    }
  };

  const abrirSeletorCategoria = async () => {
    await carregarCategorias();
    setShowCategoryModal(true);
  };

  const selecionarCategoria = (cat: string) => {
    setCategoria(cat);
    setNovaCategoria('');
    setIsCreatingNewCategory(false);
    setShowCategoryModal(false);
  };

  const confirmarNovaCategoria = () => {
    const categoriaLimpa = novaCategoria.trim();
    if (!categoriaLimpa) {
      Alert.alert('Aviso', 'Escreve o nome da nova categoria.');
      return;
    }

    setCategoria(categoriaLimpa);
    setCategoriasExistentes((prev) =>
      prev.includes(categoriaLimpa) ? prev : [...prev, categoriaLimpa]
    );
    setNovaCategoria('');
    setIsCreatingNewCategory(false);
    setShowCategoryModal(false);
  };

  const handleInserir = async () => {
    if (!nomeItem || !preco || !categoria || !estadoEspirito) {
      Alert.alert('Aviso', 'Preenche todos os campos.');
      return;
    }

    if (dataAlvo.getTime() <= Date.now()) {
      Alert.alert('Aviso', 'Seleciona um dia futuro para o tempo de reflexão.');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const precoNumerico = parseFloat(preco.replace(',', '.'));
      const dataLiberacaoISO = dataAlvo.toISOString();

      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          nome: nomeItem, 
          preco: precoNumerico,
          categoria,
          category: categoria,
          estadoEspirito,
          estadoDeEspirito: estadoEspirito,
          mood: estadoEspirito,
          dataLiberacao: dataLiberacaoISO // Enviamos a data e hora exata que deslizaste
        }),
      });

      if (response.ok) {
        await salvarEstadoEspiritoLocal(nomeItem, precoNumerico, categoria, dataLiberacaoISO, estadoEspirito);
        Alert.alert('Sucesso', 'Desejo registado!');
        setNomeItem(''); 
        setPreco(''); 
        setCategoria('');
        setEstadoEspirito('');
        setNovaCategoria('');
        setIsCreatingNewCategory(false);
        setDataAlvo(getDefaultReflectionDate());
      } else {
        Alert.alert('Erro', 'Não foi possível guardar o desejo.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na rede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={style.container}>
      <Text style={style.title}>Novo Desejo</Text>
      
      <Text style={style.label}>Nome do Produto:</Text>
      <TextInput style={style.input} value={nomeItem} onChangeText={setNomeItem} placeholder="Ex: Ténis de corrida" />
      
      <Text style={style.label}>Preço (€):</Text>
      <TextInput style={style.input} keyboardType="numeric" value={preco} onChangeText={setPreco} placeholder="0.00" />
      
      <Text style={style.label}>Categoria:</Text>
      <TouchableOpacity style={style.categoryButton} onPress={abrirSeletorCategoria}>
        <Text style={[style.categoryButtonText, !categoria && style.placeholderText]}>
          {categoria || 'Selecionar categoria'}
        </Text>
      </TouchableOpacity>

      <Text style={style.label}>Estado de espirito:</Text>
      <View style={style.moodContainer}>
        {opcoesEstadoEspirito.map((mood) => {
          const selecionado = estadoEspirito === mood;
          return (
            <TouchableOpacity
              key={mood}
              style={[style.moodChip, selecionado && style.moodChipSelected]}
              onPress={() => setEstadoEspirito(mood)}
            >
              <Text style={[style.moodChipText, selecionado && style.moodChipTextSelected]}>
                {mood}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={showCategoryModal}
        onRequestClose={() => {
          setShowCategoryModal(false);
          setIsCreatingNewCategory(false);
          setNovaCategoria('');
        }}
      >
        <View style={style.modalOverlay}>
          <View style={style.modalCard}>
            <Text style={style.modalTitle}>Escolher Categoria</Text>

            <ScrollView style={style.modalList}>
              {categoriasExistentes.length > 0 ? (
                categoriasExistentes.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={style.categoryItem}
                    onPress={() => selecionarCategoria(cat)}
                  >
                    <Text style={style.categoryItemText}>{cat}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={style.modalEmptyText}>Ainda não tens categorias guardadas.</Text>
              )}
            </ScrollView>

            {!isCreatingNewCategory ? (
              <TouchableOpacity
                style={style.newCategoryBtn}
                onPress={() => setIsCreatingNewCategory(true)}
              >
                <Text style={style.newCategoryBtnText}>+ Criar nova categoria</Text>
              </TouchableOpacity>
            ) : (
              <View style={style.newCategoryBox}>
                <TextInput
                  style={style.input}
                  value={novaCategoria}
                  onChangeText={setNovaCategoria}
                  placeholder="Nome da nova categoria"
                />
                <View style={style.newCategoryActions}>
                  <TouchableOpacity style={style.cancelSmallBtn} onPress={() => setIsCreatingNewCategory(false)}>
                    <Text style={style.cancelSmallBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={style.confirmSmallBtn} onPress={confirmarNovaCategoria}>
                    <Text style={style.confirmSmallBtnText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={style.closeModalBtn}
              onPress={() => {
                setShowCategoryModal(false);
                setIsCreatingNewCategory(false);
                setNovaCategoria('');
              }}
            >
              <Text style={style.closeModalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={style.label}>Definir Data e Hora de Libertação:</Text>
      <TouchableOpacity style={style.reflectionSelectButton} onPress={abrirCalendario}>
        <Text style={style.reflectionSelectText}>
          Selecionar dia no calendário
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={style.dateButton}>
        <Text style={style.dateText}>
          📅 Liberação: {dataAlvo.toLocaleDateString()} às {dataAlvo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={showDateModal}
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={style.modalOverlay}>
          <View style={style.modalCard}>
            <Text style={style.modalTitle}>Selecionar Dia de Reflexão</Text>

            <View style={style.pickerWrapper}>
              {Platform.OS === 'web' ? (
                <ScrollView style={style.webDateList}>
                  {gerarOpcoesDiasWeb().map((dia) => {
                    const chave = dia.toISOString();
                    const selecionado =
                      dia.toDateString() === tempDate.toDateString();

                    return (
                      <TouchableOpacity
                        key={chave}
                        style={[
                          style.categoryItem,
                          selecionado && style.selectedReflectionItem,
                        ]}
                        onPress={() => setTempDate(dia)}
                      >
                        <Text style={style.categoryItemText}>
                          {dia.toLocaleDateString('pt-PT', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                  onChange={handleReflectionDateChange}
                  minimumDate={new Date()}
                  themeVariant="light"
                  textColor="#000000"
                />
              )}
            </View>

            <View style={style.newCategoryActions}>
              <TouchableOpacity style={style.cancelSmallBtn} onPress={() => setShowDateModal(false)}>
                <Text style={style.cancelSmallBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={style.confirmSmallBtn} onPress={confirmarDataReflexao}>
                <Text style={style.confirmSmallBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2ec4b6" />
      ) : (
        <TouchableOpacity style={style.submitButton} onPress={handleInserir}>
          <Text style={style.submitButtonText}>Guardar Desejo</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const style = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: '#ffffff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 25, 
    color: '#000000' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 6, 
    color: '#333333' 
  },
  input: { 
    height: 45, 
    borderWidth: 1, 
    borderColor: '#cccccc', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 15,
    color: '#000000', 
    backgroundColor: '#f9f9f9' 
  },
  categoryButton: {
    height: 45,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  categoryButtonText: {
    color: '#000000',
    fontSize: 14,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  moodChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  moodChipSelected: {
    borderColor: '#2ec4b6',
    backgroundColor: '#e6fffb',
  },
  moodChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  moodChipTextSelected: {
    color: '#0f766e',
  },
  placeholderText: {
    color: '#8f8f8f',
  },
  reflectionSelectButton: {
    height: 45,
    borderWidth: 1,
    borderColor: '#2ec4b6',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#f2fffd',
  },
  reflectionSelectText: {
    color: '#0f766e',
    fontWeight: '600',
    fontSize: 14,
  },
  dateButton: { 
    minHeight: 48, 
    borderWidth: 1, 
    borderColor: '#2ec4b6', 
    borderRadius: 8, 
    justifyContent: 'center', 
    paddingHorizontal: 12, 
    marginBottom: 25,
    backgroundColor: '#ffffff'
  },
  dateText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500'
  },
  pickerWrapper: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
    padding: 10,
  },
  webDateList: {
    maxHeight: 260,
  },
  submitButton: {
    backgroundColor: '#2ec4b6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalList: {
    marginBottom: 12,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  selectedReflectionItem: {
    backgroundColor: '#e8fffb',
    borderRadius: 6,
  },
  categoryItemText: {
    fontSize: 15,
    color: '#1f2937',
  },
  modalEmptyText: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  newCategoryBtn: {
    backgroundColor: '#e6faf7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  newCategoryBtnText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  newCategoryBox: {
    marginBottom: 10,
  },
  newCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelSmallBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelSmallBtnText: {
    color: '#334155',
    fontWeight: '600',
  },
  confirmSmallBtn: {
    flex: 1,
    backgroundColor: '#2ec4b6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmSmallBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  closeModalBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  closeModalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});