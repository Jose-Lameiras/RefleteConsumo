import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function PerfilScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [genero, setGenero] = useState('');
  const [isFumador, setIsFumador] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const router = useRouter();
  const opcoesGenero = ['Masculino', 'Feminino', 'Prefiro não dizer'];

  useEffect(() => { carregarDadosDoServidor(); }, []);

  // 1. CARREGAR DADOS DO MONGODB
  const carregarDadosDoServidor = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/perfil', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNome(data.nome || '');
        setEmail(data.email || '');
        setGenero(data.genero || '');
        setIsFumador(!!data.isFumador);
      }
      const foto = await AsyncStorage.getItem('userImage');
      setImage(foto);
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
      setImage(result.assets[0].uri);
      await AsyncStorage.setItem('userImage', result.assets[0].uri);
    }
  };

  // 2. GUARDAR DADOS NO MONGODB
  const handleGuardar = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Atualizar dados do perfil
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/update-perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome, email, genero, isFumador }),
      });

      // Atualizar Password se preenchida
      if (newPass) {
        if (newPass !== confirmPass) throw new Error("As novas passwords não coincidem.");
        const passRes = await fetch('https://refleteconsumo-api.onrender.com/api/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
        });
        if (!passRes.ok) throw new Error("Erro ao validar password antiga.");
      }

      if (!response.ok) throw new Error("Erro ao atualizar perfil.");
      
      setIsEditing(false);
      Alert.alert("Sucesso", "Perfil atualizado no servidor!");
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
          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
          
          <Text style={styles.inputLabel}>Género</Text>
          {opcoesGenero.map((g) => (
            <TouchableOpacity key={g} style={styles.radioRow} onPress={() => setGenero(g)}>
              <View style={[styles.radio, genero === g && styles.radioSelected]} />
              <Text>{g}</Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.switchRow}>
            <Text>És fumador?</Text>
            <Switch value={isFumador} onValueChange={setIsFumador} />
          </View>

          <Text style={styles.inputLabel}>Segurança (Nova Password)</Text>
          <TextInput placeholder="Password Antiga" secureTextEntry style={styles.input} onChangeText={setOldPass} />
          <TextInput placeholder="Nova Password" secureTextEntry style={styles.input} onChangeText={setNewPass} />
          <TextInput placeholder="Confirmar Nova Password" secureTextEntry style={styles.input} onChangeText={setConfirmPass} />
          
          {isLoading ? <ActivityIndicator /> : (
            <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}><Text style={styles.btnText}>Guardar Alterações</Text></TouchableOpacity>
          )}
        </View>
      ) : (
        <View>
          <View style={styles.infoCard}><Text style={styles.label}>Nome:</Text><Text style={styles.val}>{nome}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Email:</Text><Text style={styles.val}>{email}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Género:</Text><Text style={styles.val}>{genero}</Text></View>
          <View style={styles.infoCard}><Text style={styles.label}>Fumador:</Text><Text style={styles.val}>{isFumador ? 'Sim' : 'Não'}</Text></View>
          
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}><Text style={styles.btnText}>Editar Perfil</Text></TouchableOpacity>
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
  inputLabel: { fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginTop: 5, marginBottom: 10 },
  infoCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { color: '#666', fontSize: 12 },
  val: { fontSize: 16, fontWeight: '500' },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, marginRight: 10 },
  radioSelected: { backgroundColor: '#333' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  saveButton: { backgroundColor: '#2a9d8f', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  editButton: { backgroundColor: '#264653', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: { marginTop: 40, alignItems: 'center', padding: 15 },
  logoutText: { color: 'red', fontWeight: 'bold' }
});