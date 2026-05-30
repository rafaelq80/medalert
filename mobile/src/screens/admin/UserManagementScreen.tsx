import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { StyleSheet } from 'react-native-unistyles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { Ionicons } from '@expo/vector-icons';
import { UserBadge } from '../../components/UserBadge';
import { BottomSheet } from '../../components/BottomSheet';
import {
  listarUsuarios,
  ativarUsuario,
  desativarUsuario,
  UsuarioAdmin,
} from '../../services/adminApi';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminTabs'>;

const USER_TYPES = ['PACIENTE', 'RESPONSAVEL', 'CUIDADOR', 'ADMIN'] as const;

const TYPE_LABELS: Record<string, string> = {
  PACIENTE: 'Paciente',
  RESPONSAVEL: 'Responsável',
  CUIDADOR: 'Cuidador',
  ADMIN: 'Admin',
};

export function UserManagementScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info') => setToast({ visible: true, message, type });

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  const fetchUsuarios = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (pageNum === 1 && !append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params: { page: number; size: number; tipo?: string; busca?: string } = {
          page: pageNum,
          size: PAGE_SIZE,
        };
        if (tipoFiltro) params.tipo = tipoFiltro;
        if (busca.trim()) params.busca = busca.trim();

        const response = await listarUsuarios(params);
        const data = response.data;

        if (append) {
          setUsuarios((prev) => [...prev, ...data.items]);
        } else {
          setUsuarios(data.items);
        }
        setTotal(data.total);
        setPage(pageNum);
      } catch {
        showToast('Não foi possível carregar a lista de usuários.', 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [tipoFiltro, busca],
  );

  useEffect(() => {
    fetchUsuarios(1);
  }, [fetchUsuarios]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsuarios(1);
  }, [fetchUsuarios]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || usuarios.length >= total) return;
    fetchUsuarios(page + 1, true);
  }, [loadingMore, usuarios.length, total, page, fetchUsuarios]);

  const [toggleTarget, setToggleTarget] = useState<UsuarioAdmin | null>(null);

  const handleToggleAtivo = useCallback(
    (usuario: UsuarioAdmin) => {
      setToggleTarget(usuario);
    },
    [],
  );

  const doToggleAtivo = useCallback(async () => {
    if (!toggleTarget) return;
    setToggleTarget(null);
    try {
      if (toggleTarget.ativo) {
        await desativarUsuario(toggleTarget.id);
      } else {
        await ativarUsuario(toggleTarget.id);
      }
      fetchUsuarios(1);
    } catch {
      showToast('Não foi possível alterar o status.', 'error');
    }
  }, [toggleTarget, fetchUsuarios]);

  const handleUserPress = useCallback(
    (usuario: UsuarioAdmin) => {
      navigation.navigate('UserDetail', { userId: usuario.id });
    },
    [navigation],
  );

  const handleFilterPress = useCallback(
    (tipo: string) => {
      setTipoFiltro((prev) => (prev === tipo ? undefined : tipo));
    },
    [],
  );

  const renderFilterChips = () => (
    <View style={styles.filtersContainer}>
      {USER_TYPES.map((tipo) => {
        const isActive = tipoFiltro === tipo;
        const badgeStyle = getTypeBadgeStyle(tipo);
        const textColor = isActive ? getTypeBadgeTextColor(tipo) : undefined;
        return (
          <TouchableOpacity
            key={tipo}
            style={[styles.filterChip, isActive && badgeStyle]}
            onPress={() => handleFilterPress(tipo)}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${TYPE_LABELS[tipo]}`}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.filterChipText, isActive && { color: textColor }]}>
              {TYPE_LABELS[tipo]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderUserItem = ({ item }: { item: UsuarioAdmin }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item)}
      onLongPress={() => handleToggleAtivo(item)}
      accessibilityRole="button"
      accessibilityLabel={`Usuário ${item.nome}, ${TYPE_LABELS[item.tipo]}, ${item.ativo ? 'ativo' : 'inativo'}`}
    >
      <View style={styles.badgeWrapper}>
        <UserBadge nome={item.nome} size={38} />
        <View style={[styles.statusDot, item.ativo ? styles.statusActive : styles.statusInactive]} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nome}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={[styles.typeBadge, getTypeBadgeStyle(item.tipo)]}>
        <Text style={[styles.typeBadgeText, { color: getTypeBadgeTextColor(item.tipo) }]}>{TYPE_LABELS[item.tipo]}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={styles.primaryColor.color} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast(t => ({ ...t, visible: false }))} />

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Usuários</Text>
        <Text style={styles.sectionCount}>{total}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou email..."
          placeholderTextColor={styles.onSurfaceVariantColor.color}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
          accessibilityLabel="Campo de busca de usuários"
        />
      </View>

      {renderFilterChips()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.primaryColor.color} />
          <Text style={styles.loadingText}>Carregando usuários...</Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[styles.primaryColor.color]}
              tintColor={styles.primaryColor.color}
            />
          }
          contentContainerStyle={usuarios.length === 0 ? styles.listEmpty : styles.listContent}
        />
      )}

      <BottomSheet
        visible={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        description={`Deseja ${toggleTarget?.ativo ? 'desativar' : 'ativar'} "${toggleTarget?.nome}"?`}
        icon={toggleTarget?.ativo ? '⛔' : '✅'}
        actions={[
          { label: toggleTarget?.ativo ? 'Desativar' : 'Ativar', variant: toggleTarget?.ativo ? 'destructive' : 'default', onPress: doToggleAtivo },
          { label: 'Cancelar', variant: 'cancel', onPress: () => setToggleTarget(null) },
        ]}
      />
    </View>
  );
}

function getTypeBadgeStyle(tipo: string) {
  switch (tipo) {
    case 'ADMIN':
      return { backgroundColor: '#c62828' }; // vermelho escuro — fonte branca
    case 'PACIENTE':
      return { backgroundColor: '#bbdefb' }; // azul claro — fonte escura
    case 'RESPONSAVEL':
      return { backgroundColor: '#1565c0' }; // azul escuro — fonte branca
    case 'CUIDADOR':
      return { backgroundColor: '#ce93d8' }; // lilás — fonte escura
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
    backgroundColor: theme.surfaceHigh,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.onSurface,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: theme.primaryContainer,
    borderColor: theme.primaryContainer,
  },
  filterChipText: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.onTag,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listEmpty: {
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
    marginTop: 2,
  },
  badgeWrapper: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#252525',
  },
  typeBadge: {
    minWidth: 90,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusActive: {
    backgroundColor: theme.secondary,
  },
  statusInactive: {
    backgroundColor: theme.error,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
  },
  primaryColor: { color: theme.primary },
  onSurfaceVariantColor: { color: theme.onSurfaceVariant },
  errorContainerBg: { backgroundColor: theme.errorContainer },
  onPrimaryContainerBg: { backgroundColor: theme.primaryContainer },
  secondaryContainerBg: { backgroundColor: theme.secondaryContainer },
  surfaceHighBg: { backgroundColor: theme.surfaceHigh },
}));
