import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUnistyles } from 'react-native-unistyles';
import { MedicamentosScreen } from '../screens/main/MedicamentosScreen';
import { MedicamentoFormScreen } from '../screens/main/MedicamentoFormScreen';
import { AgendaFormScreen } from '../screens/main/AgendaFormScreen';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from '../components/UserBadge';
import { Medicamento } from '../types';

export type MedicamentosStackParamList = {
  MedicamentosList: undefined;
  MedicamentoForm: { pacienteId: number; pacienteNome?: string; medicamento?: Medicamento };
  AgendaForm: { medicamentoId: number; medicamentoNome: string };
};

const Stack = createNativeStackNavigator<MedicamentosStackParamList>();

function MedHeader() {
  const { user } = useAuth();
  const { theme } = useUnistyles();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <UserBadge nome={user?.nome ?? 'U'} size={30} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.onSurface, maxWidth: 200 }} numberOfLines={1}>
        {user?.nome}
      </Text>
    </View>
  );
}

export function MedicamentosNavigator() {
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.onSurface }}>
      <Stack.Screen name="MedicamentosList" component={MedicamentosScreen} options={{ headerTitle: () => <MedHeader /> }} />
      <Stack.Screen name="MedicamentoForm" component={MedicamentoFormScreen} options={({ route }) => ({ title: route.params.medicamento ? 'Editar Medicamento' : 'Novo Medicamento' })} />
      <Stack.Screen name="AgendaForm" component={AgendaFormScreen} options={{ title: 'Horários de Tomada' }} />
    </Stack.Navigator>
  );
}
