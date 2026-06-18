import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showSmokeTracker, setShowSmokeTracker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPerfil = async () => {
      try {
        const isFumador = await AsyncStorage.getItem('isFumador');
        if (isFumador === 'true') {
          setShowSmokeTracker(true);
        } else {
          setShowSmokeTracker(false);
        }
      } catch (error) {
        console.error("Erro ao ler perfil no layout:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkPerfil();
  }, []);

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

      {/* ROTA DO SMOKE: Agora sempre declarada, mas oculta dinamicamente via href */}
      <Tabs.Screen
        name="smoke"
        options={{
          title: 'Smoke',
          tabBarHref: showSmokeTracker ? undefined : null, // <-- Remove do menu se for false de forma limpa!
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="smoke.fill" color={color} />,
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