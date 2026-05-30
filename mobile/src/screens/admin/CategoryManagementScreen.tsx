import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import {
  Categoria,
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
} from '../../services/adminApi';
import { BottomSheet } from '../../components/BottomSheet';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

export function CategoryManagementScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const fetchCategorias = useCallback(async () => {
    try {
      const response = await listarCategorias();
      setCategorias(response.data);
    } catch {
      showToast('Não foi possível carregar as categorias.', 'error');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setIsLoading(true); await fetchCategorias(); setIsLoading(false); };
    load();
  }, [fetchCategorias]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true); await fetchCategorias(); setIsRefreshing(false);
  }, [fetchCategorias]);

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return categorias;
    const q = searchQuery.toLowerCase();
    return categorias.filter(
      (c) => c.nome.toLowerCase().includes(q) || (c.descricao && c.descricao.toLowerCase().includes(q))
    );
  }, [categorias, searchQuery]);

  const openCreateModal = useCallback(() => {
    setEditingCategoria(null); setNome(''); setDescricao(''); setModalVisible(true);
  }, []);

  const openEditModal = useCallback((categoria: Categoria) => {
    setEditingCategoria(categoria); setNome(categoria.nome); setDescricao(categoria.descricao ?? ''); setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false); setEditingCategoria(null); setNome(''); setDescricao('');
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedNome = nome.trim();
    if (!trimmedNome) { showToast('O nome é obrigatório.', 'error'); return; }
    setIsSaving(true);
    try {
      if (editingCategoria) {
        await atualizarCategoria(editingCategoria.id, { nome: trimmedNome, descricao: descricao.trim() || undefined });
        showToast('Categoria atualizada.', 'success');
      } else {
        await criarCategoria({ nome: trimmedNome, descricao: descricao.trim() || undefined });
        showToast('Categoria criada.', 'success');
      }
      closeModal();
      await fetchCategorias();
    } catch (error: any) {
      showToast(error?.response?.data?.detail ?? 'Erro ao salvar.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [nome, descricao, editingCategoria, closeModal, fetchCategorias]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await excluirCategoria(deleteTarget.id);
      showToast('Categoria excluída.', 'success');
      await fetchCategorias();
    } catch (error: any) {
      showToast(error?.response?.data?.detail ?? 'Erro ao excluir.', 'error');
    }
    setDeleteTarget(null);
  }, [deleteTarget, fetchCategorias]);

  const renderItem = useCallback(({ item }: { item: Categoria }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} accessibilityLabel={`Editar ${item.nome}`}>
      <View style={styles.cardIconBg}>
        <Ionicons name="pricetag" size={18} color={styles.primaryContainerColor.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        {item.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTarget(item)} accessibilityLabel={`Excluir ${item.nome}`}>
        <Ionicons name="trash-outline" size={16} color={styles.errorColor.color} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [openEditModal]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={styles.primaryContainerColor.color} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />

      {/* Section title + search */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <Text style={styles.count}>{categorias.length}</Text>
      </View>

      {categorias.length > 3 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={styles.onSurfaceVariantColor.color} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar categoria..."
            placeholderTextColor={styles.onSurfaceVariantColor.color}
          />
        </View>
      )}

      <FlatList
        data={filteredCategorias}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={filteredCategorias.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={styles.outlineColor.color} />
            <Text style={styles.emptyTitle}>{searchQuery ? 'Nenhum resultado' : 'Nenhuma categoria'}</Text>
            <Text style={styles.emptySubtitle}>{searchQuery ? 'Tente outro termo.' : 'Toque em + para criar.'}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[styles.primaryContainerColor.color]} />}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal} accessibilityLabel="Criar categoria">
        <Ionicons name="add" size={26} color={styles.onPrimaryColor.color} />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategoria ? 'Editar' : 'Nova Categoria'}</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color={styles.onSurfaceVariantColor.color} /></TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome *" placeholderTextColor={styles.outlineColor.color} autoFocus />
            <TextInput style={[styles.input, styles.textArea]} value={descricao} onChangeText={setDescricao} placeholder="Descrição (opcional)" placeholderTextColor={styles.outlineColor.color} multiline numberOfLines={3} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={isSaving}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color={styles.onPrimaryColor.color} /> : (
                  <><Ionicons name="checkmark" size={16} color={styles.onPrimaryColor.color} /><Text style={styles.saveBtnText}>Salvar</Text></>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomSheet
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Categoria"
        description={`Deseja excluir "${deleteTarget?.nome}"?`}
        icon="🏷️"
        actions={[
          { label: 'Excluir', variant: 'destructive', onPress: handleConfirmDelete },
          { label: 'Cancelar', variant: 'cancel', onPress: () => setDeleteTarget(null) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: { flex: 1, backgroundColor: theme.backgroundApp },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundApp },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.screenTitleColor},
  count: {
    fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant,
    backgroundColor: theme.surfaceHigh, borderRadius: 9999,
    paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: theme.surfaceLow, borderRadius: 8,
    borderWidth: 1, borderColor: theme.outline, paddingHorizontal: 12, minHeight: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.onSurface },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.onSurface },
  emptySubtitle: { fontSize: 15, color: theme.onSurfaceVariant },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.surfaceCard, borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.outlineVariant,
  },
  cardIconBg: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: theme.surfaceHigh, justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.onSurface },
  cardDesc: { fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant, marginTop: 2 },
  deleteBtn: { padding: 8 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.primaryContainer, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.surfaceCard, borderRadius: 16, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: theme.onSurface },
  input: {
    borderWidth: 1, borderColor: theme.outlineVariant, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: theme.inputText,
    backgroundColor: theme.inputBg, marginBottom: 12,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    backgroundColor: theme.primaryContainer,
  },
  saveBtnText: { fontSize: 13, fontWeight: '500', color: theme.onPrimary },
  primaryContainerColor: { color: theme.primaryContainer },
  errorColor: { color: theme.error },
  onPrimaryColor: { color: theme.onPrimary },
  onSurfaceVariantColor: { color: theme.onSurfaceVariant },
  outlineColor: { color: theme.outline },
}));
