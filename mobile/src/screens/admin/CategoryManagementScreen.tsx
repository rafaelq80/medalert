import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/typography';
import {
  Categoria,
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
} from '../../services/adminApi';

export function CategoryManagementScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const fetchCategorias = useCallback(async () => {
    try {
      const response = await listarCategorias();
      setCategorias(response.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as categorias.');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchCategorias();
      setIsLoading(false);
    };
    load();
  }, [fetchCategorias]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCategorias();
    setIsRefreshing(false);
  }, [fetchCategorias]);

  const openCreateModal = useCallback(() => {
    setEditingCategoria(null);
    setNome('');
    setDescricao('');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((categoria: Categoria) => {
    setEditingCategoria(categoria);
    setNome(categoria.nome);
    setDescricao(categoria.descricao ?? '');
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingCategoria(null);
    setNome('');
    setDescricao('');
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      Alert.alert('Validação', 'O nome da categoria é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategoria) {
        await atualizarCategoria(editingCategoria.id, {
          nome: trimmedNome,
          descricao: descricao.trim() || undefined,
        });
        Alert.alert('Sucesso', 'Categoria atualizada com sucesso.');
      } else {
        await criarCategoria({
          nome: trimmedNome,
          descricao: descricao.trim() || undefined,
        });
        Alert.alert('Sucesso', 'Categoria criada com sucesso.');
      }
      closeModal();
      await fetchCategorias();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Erro', detail ?? 'Não foi possível salvar a categoria.');
    } finally {
      setIsSaving(false);
    }
  }, [nome, descricao, editingCategoria, closeModal, fetchCategorias]);

  const handleDelete = useCallback(
    (categoria: Categoria) => {
      Alert.alert(
        'Confirmar exclusão',
        `Deseja realmente excluir a categoria "${categoria.nome}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                await excluirCategoria(categoria.id);
                Alert.alert('Sucesso', 'Categoria excluída com sucesso.');
                await fetchCategorias();
              } catch (error: any) {
                const detail = error?.response?.data?.detail;
                Alert.alert(
                  'Erro',
                  detail ?? 'Não foi possível excluir a categoria.',
                );
              }
            },
          },
        ],
      );
    },
    [fetchCategorias],
  );

  const renderItem = useCallback(
    ({ item }: { item: Categoria }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEditModal(item)}
        accessibilityLabel={`Editar categoria ${item.nome}`}
        accessibilityRole="button"
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          {item.descricao ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.descricao}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          accessibilityLabel={`Excluir categoria ${item.nome}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [openEditModal, handleDelete],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
        <Text style={styles.loadingText}>Carregando categorias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={
          categorias.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyTitle}>Nenhuma categoria cadastrada</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão + para criar uma nova categoria.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primaryContainer]}
            tintColor={colors.primaryContainer}
          />
        }
        accessibilityLabel="Lista de categorias"
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateModal}
        accessibilityLabel="Criar nova categoria"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>

            <Text style={styles.inputLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da categoria"
              placeholderTextColor={colors.outline}
              maxLength={100}
              autoFocus
              accessibilityLabel="Nome da categoria"
            />

            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={3}
              accessibilityLabel="Descrição da categoria"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={isSaving}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityLabel="Salvar categoria"
                accessibilityRole="button"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundApp,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  listContent: {
    padding: spacing.marginMobile,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.stackGap,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.onPrimary,
    fontWeight: '600',
    lineHeight: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.cardPadding,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.default,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.default,
    backgroundColor: colors.primaryContainer,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});
