import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Vinculo, PacienteOption } from '../types';

export interface UsePacienteSelectorReturn {
  pacientes: PacienteOption[];
  selectedPacienteId: number | null;
  pacienteNome: string | null;
  handleSelectPaciente: (id: number) => void;
  loadPacientes: () => Promise<number | null>;
}

/**
 * Shared hook for patient selection logic used across multiple screens.
 * Handles fetching vínculos, building options list, and maintaining selection state.
 */
export function usePacienteSelector(): UsePacienteSelectorReturn {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
  const [pacienteNome, setPacienteNome] = useState<string | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  /**
   * Loads patient options based on user type.
   * Returns the selected patient ID (or user.id for PACIENTE).
   */
  const loadPacientes = useCallback(async (): Promise<number | null> => {
    if (!user) return null;

    if (user.tipo === 'PACIENTE') {
      selectedIdRef.current = user.id;
      setSelectedPacienteId(user.id);
      setPacientes([]);
      setPacienteNome(null);
      return user.id;
    }

    // Cuidador/Responsável — fetch vínculos
    const { data: vinculos } = await api.get<Vinculo[]>('/vinculos');
    const activeVinculos = vinculos.filter((v) => v.ativo);

    if (activeVinculos.length === 0) {
      setPacientes([]);
      setPacienteNome(null);
      setSelectedPacienteId(null);
      selectedIdRef.current = null;
      return null;
    }

    const options: PacienteOption[] = activeVinculos.map((v) => ({
      id: v.paciente_id,
      label: v.paciente_nome || `Paciente #${v.paciente_id}`,
    }));
    setPacientes(options);

    // Keep current selection if still valid, otherwise pick first
    const currentValid = selectedIdRef.current && options.some((o) => o.id === selectedIdRef.current);
    const targetId = currentValid ? selectedIdRef.current! : options[0].id;
    selectedIdRef.current = targetId;
    setSelectedPacienteId(targetId);

    const selected = options.find((o) => o.id === targetId);
    setPacienteNome(selected?.label || null);

    return targetId;
  }, [user]);

  const handleSelectPaciente = useCallback((id: number) => {
    selectedIdRef.current = id;
    setSelectedPacienteId(id);
    const selected = pacientes.find((p) => p.id === id);
    setPacienteNome(selected?.label || null);
  }, [pacientes]);

  return {
    pacientes,
    selectedPacienteId,
    pacienteNome,
    handleSelectPaciente,
    loadPacientes,
  };
}
