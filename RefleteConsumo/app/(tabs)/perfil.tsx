import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function PerfilScreen() {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [genero, setGenero] = useState<string>('');
  const [isFumador, setIsFumador] = useState<boolean>(false);
  const [salario, setSalario] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [oldPass, setOldPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');
  
  const router = useRouter();
  const opcoesGenero: string[] = ['Masculino', 'Feminino', 'Outro'];

  useEffect(() => { 
    carregarDadosDoServidor(); 
  }, []);

  // 1. CARREGAR DADOS DO MONGODB
  const carregarDadosDoServidor = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const salarioLocal = await AsyncStorage.getItem('userSalary');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/perfil', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        setNome(data.nome || '');
        setEmail(data.email || '');
        setGenero(data.genero || '');
        setIsFumador(!!data.isFumador);
        const salarioServidor =
          data.salario !== undefined && data.salario !== null ? String(data.salario) : '';
        setSalario(salarioServidor || salarioLocal || '');
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados do servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
    }
  };

  // 2. GUARDAR DADOS NO MONGODB
  const handleGuardar = async () => {
    setIsLoading(true);
    try {
      const salarioNormalizado = salario.trim().replace(',', '.');
      const salarioNumerico = salarioNormalizado ? parseFloat(salarioNormalizado) : null;

      if (salarioNormalizado && (isNaN(salarioNumerico as number) || (salarioNumerico as number) <= 0)) {
        throw new Error('Introduz um salário mensal válido.');
      }

      const token = await AsyncStorage.getItem('userToken');
      
      // Atualizar dados do perfil
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/update-perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome, email, genero, isFumador, salario: salarioNumerico }),
      });

      if (salarioNumerico !== null) {
        await AsyncStorage.setItem('userSalary', String(salarioNumerico));
      } else {
        await AsyncStorage.removeItem('userSalary');
      }

      if (!response.ok) throw new Error("Erro ao atualizar dados do perfil.");

      // Atualizar Password APENAS se o utilizador digitou algo
      if (newPass.trim() !== '') {
        if (!oldPass.trim()) throw new Error("Por favor, introduz a tua password antiga para autorizar a alteração.");
        if (newPass !== confirmPass) throw new Error("As novas passwords não coincidem.");
        
        const passRes = await fetch('https://refleteconsumo-api.onrender.com/api/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
        });
        
        const passData = await passRes.json();
        if (!passRes.ok) throw new Error(passData.error || "Erro ao validar password antiga.");
      }

      // Limpar os campos de password após o sucesso
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      
      setIsEditing(false);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      carregarDadosDoServidor(); 
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Perfil de Utilizador</Text>

      <TouchableOpacity onPress={isEditing ? pickImage : undefined} style={styles.photoBox}>
        {image ? <Image source={{ uri: image }} style={styles.photo} /> : <Text style={{color: '#fff'}}>+ Foto</Text>}
      </TouchableOpacity>

      {isEditing ? (
        <View>
          <Text style={styles.inputLabel}>Nome Completo</Text>
          <TextInput style={styles.input} placeholder="Insere o teu nome e apelido" value={nome} onChangeText={setNome} />
          
          <Text style={styles.inputLabel}>Endereço de E-mail</Text>
          <TextInput style={styles.input} placeholder="exemplo@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
          
          <Text style={styles.inputLabel}>Género</Text>
          {opcoesGenero.map((g) => (
            <TouchableOpacity key={g} style={styles.radioRow} onPress={() => setGenero(g)}>
              <View style={[styles.radio, genero === g && styles.radioSelected]} />
              <Text>{g}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.inputLabel}>Salário Mensal (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1200"
            keyboardType="numeric"
            value={salario}
            onChangeText={setSalario}
          />
          
          <View style={styles.switchRow}>
            <Text style={{fontWeight: 'bold'}}>És fumador?</Text>
            <Switch value={isFumador} onValueChange={setIsFumador} />
          </View>

          {/* Secção de segurança com títulos por cima de cada campo */}
          <Text style={styles.sectionTitle}>Segurança (Alterar Password)</Text>
          
          <Text style={styles.inputLabel}>Password Antiga</Text>
          <TextInput placeholder="Digita a tua password antiga" secureTextEntry style={styles.input} value={oldPass} onChangeText={setOldPass} />
          
          <Text style={styles.inputLabel}>Nova Password</Text>
          <TextInput placeholder="Digita a nova password" secureTextEntry style={styles.input} value={newPass} onChangeText={setNewPass} />
          
          <Text style={styles.inputLabel}>Confirmar Nova Password</Text>
          <TextInput placeholder="Confirma a nova password" secureTextEntry style={styles.input} value={confirmPass} onChangeText={setConfirmPass} />
          
          {isLoading ? <ActivityIndicator size="large" color="#2a9d8f" /> : (
            <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}><Text style={styles.btnText}>Guardar Alterações</Text></TouchableOpacity>
          )}
        </View>
      ) : (
        <View>
          <View style={styles.infoCard}><Text style={styles.label}>Nome:</Text><Text style={styles.val}>{nome || 'Não definido'}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Email:</Text><Text style={styles.val}>{email || 'Não definido'}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Género:</Text><Text style={styles.val}>{genero || 'Não definido'}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Salário Mensal:</Text><Text style={styles.val}>{salario ? `${parseFloat(salario).toFixed(2)}€` : 'Não definido'}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Fumador:</Text><Text style={styles.val}>{isFumador ? 'Sim' : 'Não'}</Text></View>
          
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}><Text style={styles.btnText}>Editar Perfil</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quizButton} onPress={() => router.push('/quiz')}><Text style={styles.btnText}>Fazer Quiz</Text></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={() => { AsyncStorage.clear(); router.replace('/login'); }}>
        <Text style={styles.logoutText}>Terminar Sessão</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fdfdfd' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  photoBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#333', alignSelf: 'center', marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  photo: { width: 100, height: 100, borderRadius: 50 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 25, marginBottom: 10, color: '#264653', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  inputLabel: { fontWeight: 'bold', marginTop: 12, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginTop: 5, marginBottom: 5 },
  infoCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { color: '#666', fontSize: 12 },
  val: { fontSize: 16, fontWeight: '500', marginTop: 2 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ccc', marginRight: 10 },
  radioSelected: { backgroundColor: '#333', borderColor: '#333' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  saveButton: { backgroundColor: '#2a9d8f', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 25 },
  editButton: { backgroundColor: '#264653', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  quizButton: { backgroundColor: '#457b9d', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: { marginTop: 40, alignItems: 'center', padding: 15, marginBottom: 30 },
  logoutText: { color: 'red', fontWeight: 'bold' }
});