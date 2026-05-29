import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MedicamentosScreen } from '../screens/main/MedicamentosScreen';
import { MedicamentoFormScreen } from '../screens/main/MedicamentoFormScreen';
import { AgendaFormScreen } from '../screens/main/AgendaFormScreen';
import { Medicamento } from '../types';
import { colors } from '../constants/colors';

export type MedicamentosStackParamList = {
  MedicamentosList: undefined;
  MedicamentoForm: {
    pacienteId: number;
    pacienteNome?: string;
    medicamento?: Medicamento;
  };
  AgendaForm: {
    medicamentoId: number;
    medicamentoNome: string;
  };
};

const Stack = createNativeStackNavigator<MedicamentosStackParamList>();

export function MedicamentosNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
      }}
    >
      <Stack.Screen
        name="MedicamentosList"
        component={MedicamentosScreen}
        options={{ title: 'Medicamentos' }}
      />
      <Stack.Screen
        name="MedicamentoForm"
        component={MedicamentoFormScreen}
        options={({ route }) => ({
          title: route.params.medicamento ? 'Editar Medicamento' : 'Novo Medicamento',
        })}
      />
      <Stack.Screen
        name="AgendaForm"
        component={AgendaFormScreen}
        options={{ title: 'Horários de Tomada' }}
      />
    </Stack.Navigator>
  );
}
