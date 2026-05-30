import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { UserDetailScreen } from '../screens/admin/UserDetailScreen';
import { CategoryManagementScreen } from '../screens/admin/CategoryManagementScreen';
import { AdminPerfilScreen } from '../screens/admin/AdminPerfilScreen';

export type AdminTabParamList = { Dashboard: undefined; Usuarios: undefined; Categorias: undefined; Perfil: undefined };
export type AdminStackParamList = { AdminTabs: undefined; UserDetail: { userId: number } };

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminHeader() {
  return <AppHeader />;
}

function AdminTabNavigator() {
  const { theme } = useUnistyles();
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: theme.tabActive,
      tabBarInactiveTintColor: theme.onSurfaceVariant,
      tabBarStyle: { backgroundColor: theme.surfaceCard, borderTopColor: theme.outlineVariant },
      headerStyle: { backgroundColor: theme.surface },
      headerTintColor: theme.onSurface,
      headerTitle: () => <AdminHeader />,
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Usuarios" component={UserManagementScreen} options={{ tabBarLabel: 'Usuários', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Categorias" component={CategoryManagementScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Perfil" component={AdminPerfilScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
  const { theme } = useUnistyles();
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'Detalhes do Usuário', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.onSurface }} />
    </Stack.Navigator>
  );
}
