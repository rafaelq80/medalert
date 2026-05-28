import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import { AgendaScreen } from '../screens/main/AgendaScreen';
import { HistoricoScreen } from '../screens/main/HistoricoScreen';
import { NotificacoesScreen } from '../screens/main/NotificacoesScreen';
import { PerfilScreen } from '../screens/main/PerfilScreen';
import { MedicamentosScreen } from '../screens/main/MedicamentosScreen';

export type MainTabParamList = {
  Agenda: undefined;
  Remedios: undefined;
  Historico: undefined;
  Alertas: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { user } = useAuth();
  const isPacienteOrCuidador = user?.tipo === 'PACIENTE' || user?.tipo === 'CUIDADOR';
  const isResponsavel = user?.tipo === 'RESPONSAVEL';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: colors.surfaceCard, borderTopColor: colors.outlineVariant },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
      }}
    >
      {isPacienteOrCuidador && (
        <Tab.Screen
          name="Agenda"
          component={AgendaScreen}
          options={{
            tabBarLabel: 'Agenda',
            tabBarAccessibilityLabel: 'Agenda do dia',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {isResponsavel && (
        <Tab.Screen
          name="Remedios"
          component={MedicamentosScreen}
          options={{
            tabBarLabel: 'Remédios',
            tabBarAccessibilityLabel: 'Gerenciar remédios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="medkit-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Historico"
        component={HistoricoScreen}
        options={{
          tabBarLabel: 'Histórico',
          tabBarAccessibilityLabel: 'Histórico de adesão',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alertas"
        component={NotificacoesScreen}
        options={{
          tabBarLabel: 'Alertas',
          tabBarAccessibilityLabel: 'Notificações e alertas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarAccessibilityLabel: 'Meu perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
