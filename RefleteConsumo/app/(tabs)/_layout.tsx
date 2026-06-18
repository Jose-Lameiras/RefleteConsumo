import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import desejos from './desejos';
import { View } from 'react-native/Libraries/Components/View/View';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showSmokeTracker, setShowSmokeTracker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPerfil = async () => {
      try {
        const isFumador = await AsyncStorage.getItem('isFumador');
        // O valor guardado é a string "true" ou "false"
        if (isFumador === 'true') {
          setShowSmokeTracker(true);
        }
      } catch (error) {
        console.error("Erro ao ler perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkPerfil();
  }, []);

  // Se ainda estiver a verificar o perfil, não renderizamos nada ou um ecrã vazio
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
          title: 'desejos',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gastos"
        options={{
          title: 'gastos',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dollarsign.circle.fill" color={color} />,
        }}
      />
        <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      

      {/* Aba Dinâmica: Só aparece se o utilizador for fumador */}
      {showSmokeTracker && (
        <Tabs.Screen
          name="smoke"
          options={{
            title: 'Smoke',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="smoke.fill" color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}

