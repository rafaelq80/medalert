import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native-unistyles';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/ThemeContext';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { BottomSheet } from '../../components/BottomSheet';
import { UserBadge } from '../../components/UserBadge';
import { api } from '../../services/api';
import { common, sp } from '../../styles';

const APP_VERSION = '1.0.0';
const THEME_OPTIONS = [
  { label: 'Auto', value: 'system' as const, icon: 'phone-portrait-outline' as const },
  { label: 'Claro', value: 'light' as const, icon: 'sunny-outline' as const },
  { label: 'Escuro', value: 'dark' as const, icon: 'moon-outline' as const },
];
const FONT_OPTIONS: never[] = []; // Font scale is controlled by device accessibility settings

export function PerfilScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { themeMode, setThemeMode } = usePreferences();

  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState(user?.nome ?? '');
  const [editTelefone, setEditTelefone] = useState(user?.telefone ?? '');
  const [saving, setSaving] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = useCallback(async () => {
    if (!editNome.trim()) { showToast('Nome obrigatório.', 'error'); return; }
    setSaving(true);
    try {
      await api.put('/usuarios/me', { nome: editNome.trim(), telefone: editTelefone.trim() || null });
      await refreshUser();
      setEditing(false);
      showToast('Perfil atualizado.', 'success');
    } catch { showToast('Erro ao salvar.', 'error'); }
    finally { setSaving(false); }
  }, [editNome, editTelefone, refreshUser]);

  const handleChangePw = useCallback(async () => {
    if (!senhaAtual || senhaNova.length < 6) { showToast('Senha deve ter 6+ caracteres.', 'error'); return; }
    setChangingPw(true);
    try {
      await api.put('/usuarios/me/senha', { senha_atual: senhaAtual, nova_senha: senhaNova });
      setSenhaAtual(''); setSenhaNova(''); setShowPwForm(false);
      showToast('Senha alterada.', 'success');
    } catch { showToast('Senha atual incorreta.', 'error'); }
    finally { setChangingPw(false); }
  }, [senhaAtual, senhaNova]);

  const getTipoLabel = (t: string) => ({ PACIENTE: 'Paciente', RESPONSAVEL: 'Responsável', CUIDADOR: 'Cuidador', ADMIN: 'Admin' }[t] || t);

  return (
    <View style={{ flex: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingHorizontal: sp.xl, paddingTop: sp.xl, paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <UserBadge nome={user?.nome ?? 'U'} size={72} />
          <Text style={styles.name}>{user?.nome}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.tipoBadge}><Text style={styles.tipoBadgeText}>{getTipoLabel(user?.tipo ?? '')}</Text></View>
        </View>

        {/* Dados */}
        <View style={[common.card, { marginBottom: sp.md }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.sm }}>
            <Text style={common.sectionTitle}>Dados Pessoais</Text>
            {!editing && (
              <TouchableOpacity onPress={() => { setEditNome(user?.nome ?? ''); setEditTelefone(user?.telefone ?? ''); setEditing(true); }}>
                <Ionicons name="create-outline" size={18} color={styles.iconColor.color} />
              </TouchableOpacity>
            )}
          </View>
          {editing ? (
            <View style={{ gap: sp.sm }}>
              <TextInput style={common.input} value={editNome} onChangeText={setEditNome} placeholder="Nome" />
              <TextInput style={common.input} value={editTelefone} onChangeText={setEditTelefone} placeholder="Telefone" keyboardType="phone-pad" />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: sp.sm }}>
                <TouchableOpacity onPress={() => setEditing(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: sp.sm }}>
                  <Ionicons name="close" size={16} color={styles.iconColor.color} />
                  <Text style={common.textSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Salvar</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ gap: 2 }}>
              <InfoRow label="Telefone" value={user?.telefone || '—'} />
              {user?.tipo === 'PACIENTE' && <><InfoRow label="Nascimento" value={user?.data_nascimento || '—'} /><InfoRow label="Autonomia" value={user?.nivel_autonomia || '—'} /></>}
              {(user?.tipo === 'RESPONSAVEL' || user?.tipo === 'CUIDADOR') && <><InfoRow label="Parentesco" value={user?.grau_parentesco || '—'} /><InfoRow label="Notificações" value={user?.recebe_notificacoes ? 'Sim' : 'Não'} /></>}
            </View>
          )}
        </View>

        {/* Aparência */}
        <View style={[common.card, { marginBottom: sp.md }]}>
          <Text style={[common.sectionTitle, { marginBottom: sp.sm }]}>Aparência</Text>
          <View style={common.chipRow}>
            {THEME_OPTIONS.map(o => (
              <TouchableOpacity key={o.value} style={[common.chip, themeMode === o.value && common.chipActive]} onPress={() => setThemeMode(o.value)}>
                <Ionicons name={o.icon} size={14} color={themeMode === o.value ? styles.chipActiveIcon.color : styles.iconColor.color} />
                <Text style={[common.chipText, themeMode === o.value && common.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[common.textSecondary, { marginTop: sp.md, fontSize: 12 }]}>
            Para ajustar o tamanho do texto, use as configurações de acessibilidade do seu dispositivo.
          </Text>
        </View>

        {/* Segurança */}
        <View style={[common.card, { marginBottom: sp.md }]}>
          <Text style={[common.sectionTitle, { marginBottom: sp.sm }]}>Segurança</Text>
          {showPwForm ? (
            <View style={{ gap: sp.sm }}>
              <TextInput style={common.input} value={senhaAtual} onChangeText={setSenhaAtual} placeholder="Senha atual" secureTextEntry />
              <TextInput style={common.input} value={senhaNova} onChangeText={setSenhaNova} placeholder="Nova senha (6+)" secureTextEntry />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: sp.sm }}>
                <TouchableOpacity onPress={() => { setShowPwForm(false); setSenhaAtual(''); setSenhaNova(''); }} style={{ padding: sp.sm }}>
                  <Text style={common.textSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChangePw} disabled={changingPw} style={styles.saveBtn}>
                  {changingPw ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Alterar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={common.menuItem} onPress={() => setShowPwForm(true)}>
              <Ionicons name="lock-closed-outline" size={18} color={styles.iconColor.color} />
              <Text style={common.menuItemText}>Alterar senha</Text>
              <Ionicons name="chevron-forward" size={16} color={styles.iconColor.color} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={common.menuItem} onPress={() => setShowLogoutConfirm(true)}>
            <Ionicons name="log-out-outline" size={18} color={styles.errorColor.color} />
            <Text style={[common.menuItemText, styles.errorColor]}>Sair da conta</Text>
            <Ionicons name="chevron-forward" size={16} color={styles.iconColor.color} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>MedAlert v{APP_VERSION}</Text>
      </ScrollView>

      <BottomSheet
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sair da conta"
        description="Deseja realmente sair? Você precisará fazer login novamente."
        icon="👋"
        actions={[
          { label: 'Sair', variant: 'destructive', onPress: () => { setShowLogoutConfirm(false); logout(); } },
          { label: 'Cancelar', variant: 'cancel', onPress: () => setShowLogoutConfirm(false) },
        ]}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={common.textSecondary}>{label}</Text>
      <Text style={common.textPrimary}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  screen: { flex: 1, backgroundColor: theme.backgroundApp },
  avatarSection: { alignItems: 'center', marginBottom: sp.xl },
  name: { fontSize: 20, fontWeight: '600', color: theme.onSurface, marginTop: sp.sm },
  email: { fontSize: 14, color: theme.onSurfaceVariant, marginTop: 2 },
  tipoBadge: { marginTop: 6, backgroundColor: theme.surfaceHigh, borderRadius: sp.radiusFull, paddingHorizontal: 10, paddingVertical: 3 },
  tipoBadgeText: { fontSize: 12, fontWeight: '500', color: theme.primaryContainer },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.outlineVariant },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: sp.radius, backgroundColor: theme.primaryContainer },
  iconColor: { color: theme.onSurfaceVariant },
  chipActiveIcon: { color: theme.onPrimary },
  errorColor: { color: theme.error },
  version: { fontSize: 12, color: theme.outline, textAlign: 'center', marginTop: sp.lg },
}));
