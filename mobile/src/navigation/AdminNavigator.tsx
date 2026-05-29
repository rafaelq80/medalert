import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { UserDetailScreen } from '../screens/admin/UserDetailScreen';
import { CategoryManagementScreen } from '../screens/admin/CategoryManagementScreen';
import { AdminPerfilScreen } from '../screens/admin/AdminPerfilScreen';

export type AdminTabParamList = {
  Dashboard: undefined;
  Usuarios: undefined;
  Categorias: undefined;
  Perfil: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  UserDetail: { userId: number };
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminTabNavigator() {
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
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard administrativo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Usuarios"
        component={UserManagementScreen}
        options={{
          tabBarLabel: 'Usuários',
          tabBarAccessibilityLabel: 'Gerenciamento de usuários',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categorias"
        component={CategoryManagementScreen}
        options={{
          tabBarLabel: 'Categorias',
          tabBarAccessibilityLabel: 'Gerenciamento de categorias',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={AdminPerfilScreen}
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

export function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{
          title: 'Detalhes do Usuário',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
        }}
      />
    </Stack.Navigator>
  );
}
