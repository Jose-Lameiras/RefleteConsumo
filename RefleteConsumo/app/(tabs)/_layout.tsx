import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showSmokeTracker, setShowSmokeTracker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPerfil = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setShowSmokeTracker(false);
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('https://refleteconsumo-api.onrender.com/api/perfil', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const user = await response.json();
        console.log('👤 Perfil carregado:', { isFumador: user.isFumador, tipo: typeof user.isFumador });
        // Verifica se isFumador é true (boolean, string 'true', ou número 1)
        const isSmoker = user.isFumador === true || user.isFumador === 'true' || user.isFumador === 1;
        setShowSmokeTracker(isSmoker);
      } else {
        setShowSmokeTracker(false);
      }
    } catch (error) {
      console.error("Erro ao ler perfil no layout:", error);
      setShowSmokeTracker(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPerfil();
  }, [checkPerfil]);

  // Recarregar perfil sempre que a aba fica visível
  useFocusEffect(
    useCallback(() => {
      checkPerfil();
    }, [checkPerfil])
  );

  if (isLoading) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="desejos"
        options={{
          title: 'Desejos',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="gastos"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dollarsign.circle.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="tips"
        options={{
          title: 'Ideias',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="lightbulb.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="smoke"
        options={{
          title: 'Smoke',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="smoke.fill" color={color} />,
          href: showSmokeTracker ? '/smoke' : null,
        }}
      />
      
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}