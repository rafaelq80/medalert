import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';

export interface SelectOption {
  id: number;
  label: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  placeholder?: string;
  label?: string;
}

export function SelectDropdown({
  options,
  selectedId,
  onSelect,
  placeholder = 'Selecione',
  label,
}: SelectDropdownProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.id === selectedId);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityLabel={label || placeholder}
        accessibilityRole="button"
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.id === selectedId && styles.optionActive,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setVisible(false);
                  }}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.id === selectedId }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.id === selectedId && styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  triggerText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  placeholder: {
    color: colors.onSurfaceVariant,
  },
  arrow: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  dropdown: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    maxHeight: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  optionActive: {
    backgroundColor: colors.primaryContainer,
  },
  optionText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  optionTextActive: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
