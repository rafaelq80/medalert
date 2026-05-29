import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { colors } from '../../constants/colors';
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

  const fetchUsuario = useCallback(async () => {
    try {
      const response = await obterUsuario(userId);
      setUsuario(response.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do usuário.');
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

  const handleAlterarTipo = useCallback(() => {
    if (!usuario) return;

    const options = TIPO_OPTIONS.filter((t) => t !== usuario.tipo).map((tipo) => ({
      text: TYPE_LABELS[tipo],
      onPress: () => {
        Alert.alert(
          'Confirmar Alteração',
          `Deseja alterar o tipo de "${usuario.nome}" de ${TYPE_LABELS[usuario.tipo]} para ${TYPE_LABELS[tipo]}?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              onPress: async () => {
                try {
                  await alterarTipoUsuario(usuario.id, tipo);
                  Alert.alert('Sucesso', `Tipo alterado para ${TYPE_LABELS[tipo]} com sucesso.`);
                  fetchUsuario();
                } catch {
                  Alert.alert('Erro', 'Não foi possível alterar o tipo do usuário.');
                }
              },
            },
          ],
        );
      },
    }));

    Alert.alert('Alterar Tipo', `Selecione o novo tipo para "${usuario.nome}":`, [
      ...options,
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [usuario, fetchUsuario]);

  const handleForcarLogout = useCallback(() => {
    if (!usuario) return;

    Alert.alert(
      'Forçar Logout',
      `Tem certeza que deseja forçar o logout de "${usuario.nome}"? Todos os tokens de sessão serão revogados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Forçar Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await forcarLogout(usuario.id);
              Alert.alert(
                'Sucesso',
                `Logout forçado com sucesso. ${response.data.tokens_revogados} token(s) revogado(s).`,
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível forçar o logout do usuário.');
            }
          },
        },
      ],
    );
  }, [usuario]);

  const handleToggleAtivo = useCallback(() => {
    if (!usuario) return;

    const action = usuario.ativo ? 'desativar' : 'ativar';
    const actionLabel = usuario.ativo ? 'Desativar' : 'Ativar';

    Alert.alert(
      `${actionLabel} Usuário`,
      `Tem certeza que deseja ${action} o usuário "${usuario.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: actionLabel,
          style: usuario.ativo ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (usuario.ativo) {
                await desativarUsuario(usuario.id);
              } else {
                await ativarUsuario(usuario.id);
              }
              Alert.alert('Sucesso', `Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso.`);
              fetchUsuario();
            } catch {
              Alert.alert('Erro', `Não foi possível ${action} o usuário.`);
            }
          },
        },
      ],
    );
  }, [usuario, fetchUsuario]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header com nome e status */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.userName}>{usuario.nome}</Text>
          <View style={[styles.statusBadge, usuario.ativo ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusBadgeText}>{usuario.ativo ? 'Ativo' : 'Inativo'}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, getTypeBadgeStyle(usuario.tipo)]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[usuario.tipo]}</Text>
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

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAlterarTipo}
          accessibilityRole="button"
          accessibilityLabel="Alterar tipo do usuário"
        >
          <Text style={styles.actionButtonText}>Alterar Tipo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonWarning]}
          onPress={handleForcarLogout}
          accessibilityRole="button"
          accessibilityLabel="Forçar logout do usuário"
        >
          <Text style={[styles.actionButtonText, styles.actionButtonWarningText]}>Forçar Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, usuario.ativo ? styles.actionButtonDanger : styles.actionButtonSuccess]}
          onPress={handleToggleAtivo}
          accessibilityRole="button"
          accessibilityLabel={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
        >
          <Text
            style={[
              styles.actionButtonText,
              usuario.ativo ? styles.actionButtonDangerText : styles.actionButtonSuccessText,
            ]}
          >
            {usuario.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getTypeBadgeStyle(tipo: string) {
  switch (tipo) {
    case 'ADMIN':
      return { backgroundColor: colors.errorContainer };
    case 'PACIENTE':
      return { backgroundColor: colors.onPrimaryContainer };
    case 'RESPONSAVEL':
      return { backgroundColor: colors.secondaryContainer };
    case 'CUIDADOR':
      return { backgroundColor: '#E8DEF8' };
    default:
      return { backgroundColor: colors.surfaceContainerHigh };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundApp,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  headerCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
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
    color: colors.onSurface,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: colors.secondaryContainer,
  },
  statusInactive: {
    backgroundColor: colors.errorContainer,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  section: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButtonWarning: {
    borderColor: colors.alertWarning,
    backgroundColor: '#FFF3E0',
  },
  actionButtonWarningText: {
    color: colors.alertWarning,
  },
  actionButtonDanger: {
    borderColor: colors.error,
    backgroundColor: colors.errorContainer,
  },
  actionButtonDangerText: {
    color: colors.error,
  },
  actionButtonSuccess: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryContainer,
  },
  actionButtonSuccessText: {
    color: colors.secondary,
  },
});
