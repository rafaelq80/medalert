import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { AppHeader } from '../components/AppHeader';
import { OfflineBanner } from '../components/OfflineBanner';
import { queryKeys } from '../services/queryKeys';
import { AgendaScreen } from '../screens/main/AgendaScreen';
import { HistoricoScreen } from '../screens/main/HistoricoScreen';
import { NotificacoesScreen } from '../screens/main/NotificacoesScreen';
import { PerfilScreen } from '../screens/main/PerfilScreen';
import { VinculosScreen } from '../screens/main/VinculosScreen';
import { MedicamentosNavigator } from './MedicamentosNavigator';
import { Notificacao } from '../types';

export type MainTabParamList = {
  Alertas: undefined;
  Agenda: undefined;
  Medicamentos: undefined;
  Vinculos: undefined;
  Historico: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function UserHeader() {
  return <AppHeader />;
}

export function MainTabNavigator() {
  const { user } = useAuth();
  const { theme } = useUnistyles();
  const isPaciente = user?.tipo === 'PACIENTE';
  const isResponsavelOrCuidador = user?.tipo === 'RESPONSAVEL' || user?.tipo === 'CUIDADOR';

  const [unreadCount, setUnreadCount] = useState(0);

  // Use react-query with refetchInterval instead of manual polling
  useQuery({
    queryKey: queryKeys.notificacoes,
    queryFn: async () => {
      const { data } = await api.get<Notificacao[]>('/notificacoes', {
        params: { page: 1, size: 5 },
      });
      const count = data.filter((n) => !n.lido_em).length;
      setUnreadCount(count);
      return data;
    },
    refetchInterval: 60000, // 60s — more battery-friendly than 30s
    refetchIntervalInBackground: false,
  });

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.tabActive,
          tabBarInactiveTintColor: theme.onSurfaceVariant,
          tabBarStyle: { backgroundColor: theme.surfaceCard, borderTopColor: theme.outlineVariant },
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
          headerTitle: () => <UserHeader />,
        }}
      >
        {isResponsavelOrCuidador && (
          <Tab.Screen name="Alertas" component={NotificacoesScreen} options={{
            tabBarLabel: 'Alertas',
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: { backgroundColor: theme.error, fontSize: 11 },
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          }} />
        )}
        {(isPaciente || user?.tipo === 'CUIDADOR') && (
          <Tab.Screen name="Agenda" component={AgendaScreen} options={{
            tabBarLabel: 'Agenda',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }} />
        )}
        {isResponsavelOrCuidador && (
          <Tab.Screen name="Medicamentos" component={MedicamentosNavigator} options={{
            headerShown: false,
            tabBarLabel: 'Medicamentos',
            tabBarIcon: ({ color, size }) => <Ionicons name="medkit-outline" size={size} color={color} />,
          }} />
        )}
        {isResponsavelOrCuidador && (
          <Tab.Screen name="Vinculos" component={VinculosScreen} options={{
            tabBarLabel: 'Vínculos',
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }} />
        )}
        <Tab.Screen name="Historico" component={HistoricoScreen} options={{
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }} />
        {isPaciente && (
          <Tab.Screen name="Alertas" component={NotificacoesScreen} options={{
            tabBarLabel: 'Alertas',
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: { backgroundColor: theme.error, fontSize: 11 },
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          }} />
        )}
        <Tab.Screen name="Perfil" component={PerfilScreen} options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }} />
      </Tab.Navigator>
    </View>
  );
}
