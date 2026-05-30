import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface BottomSheetAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'destructive' | 'cancel';
  loading?: boolean;
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  actions: BottomSheetAction[];
}

export function BottomSheet({
  visible,
  onClose,
  title,
  description,
  icon,
  actions,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}

          <View style={styles.actions}>
            {actions.map((action, index) => {
              const isDestructive = action.variant === 'destructive';
              const isCancel = action.variant === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    isDestructive && styles.actionDestructive,
                    isCancel && styles.actionCancel,
                  ]}
                  onPress={action.onPress}
                  accessibilityLabel={action.label}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.actionText,
                      isDestructive && styles.actionTextDestructive,
                      isCancel && styles.actionTextCancel,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionDestructive: {
    backgroundColor: theme.error,
  },
  actionCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.outline,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  actionTextDestructive: {
    color: theme.onError,
  },
  actionTextCancel: {
    color: theme.onSurfaceVariant,
  },
}));
