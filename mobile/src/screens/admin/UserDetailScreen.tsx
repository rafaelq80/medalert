import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '../../components/BottomSheet';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import {
  obterUsuario,
  alterarTipoUsuario,
  forcarLogout,
  ativarUsuario,
  desativarUsuario,
  UsuarioDetalhe,
} from '../../services/adminApi';

type UserDetailRouteProp = RouteProp<AdminStackParamList, 'UserDetail'>;

const TYPE_LABELS: Record<string, string> = {
  PACIENTE: 'Paciente',
  RESPONSAVEL: 'Responsável',
  CUIDADOR: 'Cuidador',
  ADMIN: 'Admin',
};

const TIPO_OPTIONS = ['PACIENTE', 'RESPONSAVEL', 'CUIDADOR', 'ADMIN'] as const;

export function UserDetailScreen() {
  const route = useRoute<UserDetailRouteProp>();
  const { userId } = route.params;

  const [usuario, setUsuario] = useState<UsuarioDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchUsuario = useCallback(async () => {
    try {
      const response = await obterUsuario(userId);
      setUsuario(response.data);
    } catch {
      showToast('Não foi possível carregar os detalhes do usuário.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsuario();
  }, [fetchUsuario]);

  const [showTipoModal, setShowTipoModal] = useState(false);

  const handleConfirmTipo = useCallback(async (tipo: string) => {
    if (!usuario) return;
    setShowTipoModal(false);
    try {
      await alterarTipoUsuario(usuario.id, tipo);
      showToast(`Tipo alterado para ${TYPE_LABELS[tipo]}.`, 'success');
      fetchUsuario();
    } catch {
      showToast('Não foi possível alterar o tipo.', 'error');
    }
  }, [usuario, fetchUsuario]);

  const handleAlterarTipo = useCallback(() => {
    setShowTipoModal(true);
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);

  const doForcarLogout = useCallback(async () => {
    if (!usuario) return;
    setShowLogoutConfirm(false);
    try {
      await forcarLogout(usuario.id);
      showToast('Logout forçado com sucesso.', 'success');
    } catch {
      showToast('Não foi possível forçar o logout.', 'error');
    }
  }, [usuario]);

  const doToggleAtivo = useCallback(async () => {
    if (!usuario) return;
    setShowToggleConfirm(false);
    try {
      if (usuario.ativo) {
        await desativarUsuario(usuario.id);
      } else {
        await ativarUsuario(usuario.id);
      }
      fetchUsuario();
    } catch {
      showToast('Não foi possível alterar o status.', 'error');
    }
  }, [usuario, fetchUsuario]);

  const handleForcarLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleToggleAtivo = useCallback(() => {
    setShowToggleConfirm(true);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles.primaryColor.color} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Usuário não encontrado.</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[styles.primaryColor.color]}
          tintColor={styles.primaryColor.color}
        />
      }
    >
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />
      {/* Header com nome e status */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.userName}>{usuario.nome}</Text>
          <View style={[styles.statusBadge, usuario.ativo ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusBadgeText}>{usuario.ativo ? 'Ativo' : 'Inativo'}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, getTypeBadgeStyle(usuario.tipo)]}>
          <Text style={[styles.typeBadgeText, { color: getTypeBadgeTextColor(usuario.tipo) }]}>{TYPE_LABELS[usuario.tipo]}</Text>
        </View>
      </View>

      {/* Informações básicas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Básicas</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{usuario.email}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Telefone</Text>
          <Text style={styles.fieldValue}>{usuario.telefone || '—'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Tipo</Text>
          <Text style={styles.fieldValue}>{TYPE_LABELS[usuario.tipo]}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Status</Text>
          <Text style={styles.fieldValue}>{usuario.ativo ? 'Ativo' : 'Inativo'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Criado em</Text>
          <Text style={styles.fieldValue}>{formatDate(usuario.criado_em)}</Text>
        </View>
      </View>

      {/* Campos específicos de PACIENTE */}
      {usuario.tipo === 'PACIENTE' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Paciente</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Data de Nascimento</Text>
            <Text style={styles.fieldValue}>{formatDate(usuario.data_nascimento)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Obs. Médicas</Text>
            <Text style={styles.fieldValue}>{usuario.obs_medicas || '—'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nível de Autonomia</Text>
            <Text style={styles.fieldValue}>{usuario.nivel_autonomia || '—'}</Text>
          </View>
        </View>
      )}

      {/* Campos específicos de RESPONSAVEL/CUIDADOR */}
      {(usuario.tipo === 'RESPONSAVEL' || usuario.tipo === 'CUIDADOR') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dados do {TYPE_LABELS[usuario.tipo]}
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Grau de Parentesco</Text>
            <Text style={styles.fieldValue}>{usuario.grau_parentesco || '—'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Recebe Notificações</Text>
            <Text style={styles.fieldValue}>
              {usuario.recebe_notificacoes === null ? '—' : usuario.recebe_notificacoes ? 'Sim' : 'Não'}
            </Text>
          </View>
        </View>
      )}

      {/* Ações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleAlterarTipo}>
          <Ionicons name="swap-horizontal-outline" size={18} color={styles.primaryColor.color} />
          <Text style={styles.menuItemText}>Alterar Tipo</Text>
          <Ionicons name="chevron-forward" size={16} color={styles.outlineColor.color} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleForcarLogout}>
          <Ionicons name="log-out-outline" size={18} color={styles.warningColor.color} />
          <Text style={[styles.menuItemText, styles.warningColor]}>Forçar Logout</Text>
          <Ionicons name="chevron-forward" size={16} color={styles.outlineColor.color} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleToggleAtivo}>
          <Ionicons name={usuario.ativo ? 'close-circle-outline' : 'checkmark-circle-outline'} size={18} color={usuario.ativo ? styles.errorColor.color : styles.successColor.color} />
          <Text style={[styles.menuItemText, usuario.ativo ? styles.errorColor : styles.successColor]}>
            {usuario.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={styles.outlineColor.color} />
        </TouchableOpacity>
      </View>
    </ScrollView>

      {/* Modal Alterar Tipo */}
      <Modal visible={showTipoModal} transparent animationType="slide" onRequestClose={() => setShowTipoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Tipo</Text>
            {TIPO_OPTIONS.filter(t => t !== usuario?.tipo).map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[styles.modalItem, getTypeBadgeStyle(tipo)]}
                onPress={() => handleConfirmTipo(tipo)}
              >
                <Text style={[styles.modalItemText, { color: getTypeBadgeTextColor(tipo) }]}>
                  {TYPE_LABELS[tipo]}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowTipoModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomSheet
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Forçar Logout"
        description={`Revogar todos os tokens de "${usuario?.nome}"? O usuário será desconectado.`}
        icon="🔒"
        actions={[
          { label: 'Forçar Logout', variant: 'destructive', onPress: doForcarLogout },
          { label: 'Cancelar', variant: 'cancel', onPress: () => setShowLogoutConfirm(false) },
        ]}
      />

      <BottomSheet
        visible={showToggleConfirm}
        onClose={() => setShowToggleConfirm(false)}
        title={usuario?.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        description={`Deseja ${usuario?.ativo ? 'desativar' : 'ativar'} "${usuario?.nome}"?`}
        icon={usuario?.ativo ? '⛔' : '✅'}
        actions={[
          { label: usuario?.ativo ? 'Desativar' : 'Ativar', variant: usuario?.ativo ? 'destructive' : 'default', onPress: doToggleAtivo },
          { label: 'Cancelar', variant: 'cancel', onPress: () => setShowToggleConfirm(false) },
        ]}
      />
    </>
  );
}

function getTypeBadgeStyle(tipo: string) {
  switch (tipo) {
    case 'ADMIN':
      return { backgroundColor: '#c62828' };
    case 'PACIENTE':
      return { backgroundColor: '#bbdefb' };
    case 'RESPONSAVEL':
      return { backgroundColor: '#1565c0' };
    case 'CUIDADOR':
      return { backgroundColor: '#ce93d8' };
    default:
      return { backgroundColor: '#e0e0e0' };
  }
}

function getTypeBadgeTextColor(tipo: string) {
  switch (tipo) {
    case 'ADMIN':
    case 'RESPONSAVEL':
      return '#ffffff';
    default:
      return '#1a1a1a';
  }
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundApp,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
  },
  headerCard: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.onSurface,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: theme.secondaryContainer,
  },
  statusInactive: {
    backgroundColor: theme.errorContainer,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.onSurface,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.onSurface,
  },
  section: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
  },
  fieldLabel: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: theme.onSurface,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.outlineVariant,
  },
  menuItemText: {
    fontSize: 15,
    color: theme.onSurface,
    flex: 1,
  },
  // Color tokens
  primaryColor: { color: theme.primary },
  outlineColor: { color: theme.outline },
  warningColor: { color: theme.alertWarning },
  errorColor: { color: theme.error },
  successColor: { color: theme.secondary },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surfaceCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.onSurface,
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.outline,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
  },
}));
