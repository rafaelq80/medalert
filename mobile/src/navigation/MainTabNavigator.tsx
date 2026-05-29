import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import { AgendaScreen } from '../screens/main/AgendaScreen';
import { HistoricoScreen } from '../screens/main/HistoricoScreen';
import { NotificacoesScreen } from '../screens/main/NotificacoesScreen';
import { PerfilScreen } from '../screens/main/PerfilScreen';
import { VinculosScreen } from '../screens/main/VinculosScreen';
import { MedicamentosNavigator } from './MedicamentosNavigator';

export type MainTabParamList = {
  Alertas: undefined;
  Agenda: undefined;
  Remedios: undefined;
  Vinculos: undefined;
  Historico: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { user } = useAuth();
  const isPaciente = user?.tipo === 'PACIENTE';
  const isResponsavelOrCuidador =
    user?.tipo === 'RESPONSAVEL' || user?.tipo === 'CUIDADOR';

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
      {/* Alertas — primeira tab para Responsável/Cuidador */}
      {isResponsavelOrCuidador && (
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
      )}

      {/* Agenda — visível para Paciente e Cuidador */}
      {(isPaciente || user?.tipo === 'CUIDADOR') && (
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

      {/* Medicamentos — visível para Responsável E Cuidador */}
      {isResponsavelOrCuidador && (
        <Tab.Screen
          name="Remedios"
          component={MedicamentosNavigator}
          options={{
            headerShown: false,
            tabBarLabel: 'Remédios',
            tabBarAccessibilityLabel: 'Gerenciar remédios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="medkit-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Vínculos — visível para Responsável e Cuidador */}
      {isResponsavelOrCuidador && (
        <Tab.Screen
          name="Vinculos"
          component={VinculosScreen}
          options={{
            tabBarLabel: 'Vínculos',
            tabBarAccessibilityLabel: 'Gerenciar vínculos com pacientes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
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

      {/* Alertas — para Paciente (não é primeira tab) */}
      {isPaciente && (
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
      )}

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
