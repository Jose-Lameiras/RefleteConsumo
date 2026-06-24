import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View, Platform, TouchableOpacity, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HomeScreen() {
  const REFLECTION_PRESETS = [
    { label: '24h', days: 1 },
    { label: '3 dias', days: 3 },
    { label: '7 dias', days: 7 },
  ];

  const getDefaultReflectionDate = () => {
    const base = new Date();
    base.setDate(base.getDate() + 1);
    return base;
  };

  const [nomeItem, setNomeItem] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [dataAlvo, setDataAlvo] = useState(getDefaultReflectionDate());
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const aplicarPresetReflexao = (days: number) => {
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + days);
    setDataAlvo(novaData);
    setSelectedPreset(days);
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // No Android, fecha o picker ao selecionar; no iOS mantém o comportamento padrão
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDataAlvo(selectedDate);
      setSelectedPreset(null);
    }
  };

  const handleInserir = async () => {
    if (!nomeItem || !preco || !categoria) {
      Alert.alert('Aviso', 'Preenche todos os campos.');
      return;
    }

    // Evita que a data de libertação fique no presente/passado e conclua de imediato.
    if (dataAlvo.getTime() <= Date.now() + 60 * 1000) {
      Alert.alert('Aviso', 'Define uma data/hora futura para o tempo de reflexão.');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch('https://refleteconsumo-api.onrender.com/api/desejos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          nome: nomeItem, 
          preco: parseFloat(preco.replace(',', '.')),
          categoria,
          category: categoria,
          dataLiberacao: dataAlvo.toISOString() // Enviamos a data e hora exata que deslizaste
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Desejo registado!');
        setNomeItem(''); 
        setPreco(''); 
        setCategoria('');
        setNovaCategoria('');
        setIsCreatingNewCategory(false);
        setDataAlvo(getDefaultReflectionDate());
        setSelectedPreset(1);
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
      <View style={style.presetRow}>
        {REFLECTION_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.days}
            style={[
              style.presetChip,
              selectedPreset === preset.days && style.presetChipActive,
            ]}
            onPress={() => aplicarPresetReflexao(preset.days)}
          >
            <Text
              style={[
                style.presetChipText,
                selectedPreset === preset.days && style.presetChipTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={style.dateButton} onPress={() => setShowPicker(true)}>
        {/* Mostra a data, horas e minutos escolhidos no botão */}
        <Text style={style.dateText}>
          📅 {dataAlvo.toLocaleDateString()} às {dataAlvo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={style.pickerWrapper}>
          <DateTimePicker 
            value={dataAlvo} 
            mode="datetime"       // <--- Ativa Data + Hora juntas
            display="spinner"     // <--- Força o efeito de rodas para deslizar
            onChange={handleDateChange} 
            minimumDate={new Date()} 
            textColor="#000000"   // Garante visibilidade no iOS
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={style.closeButtonIOS} onPress={() => setShowPicker(false)}>
              <Text style={style.closeButtonTextIOS}>Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
  placeholderText: {
    color: '#8f8f8f',
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b5e7e2',
    backgroundColor: '#edf9f8',
  },
  presetChipActive: {
    backgroundColor: '#2ec4b6',
    borderColor: '#2ec4b6',
  },
  presetChipText: {
    color: '#0f766e',
    fontWeight: '600',
    fontSize: 12,
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  dateButton: { 
    height: 48, 
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
    padding: 10
  },
  closeButtonIOS: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2ec4b6',
    borderRadius: 6,
    marginTop: 10
  },
  closeButtonTextIOS: {
    color: '#fff',
    fontWeight: 'bold'
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
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
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