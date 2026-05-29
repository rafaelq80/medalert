import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { colors } from '../../constants/colors';
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
        Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
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

  const handleToggleAtivo = useCallback(
    (usuario: UsuarioAdmin) => {
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
                fetchUsuarios(1);
              } catch {
                Alert.alert('Erro', `Não foi possível ${action} o usuário.`);
              }
            },
          },
        ],
      );
    },
    [fetchUsuarios],
  );

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
        return (
          <TouchableOpacity
            key={tipo}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={() => handleFilterPress(tipo)}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${TYPE_LABELS[tipo]}`}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
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
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nome}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.userMeta}>
        <View style={[styles.typeBadge, getTypeBadgeStyle(item.tipo)]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[item.tipo]}</Text>
        </View>
        <View style={[styles.statusDot, item.ativo ? styles.statusActive : styles.statusInactive]} />
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou email..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
          accessibilityLabel="Campo de busca de usuários"
        />
      </View>

      {renderFilterChips()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={usuarios.length === 0 ? styles.listEmpty : styles.listContent}
        />
      )}
    </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
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
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.onPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.onSurfaceVariant,
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
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  userMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: colors.secondary,
  },
  statusInactive: {
    backgroundColor: colors.error,
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
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
