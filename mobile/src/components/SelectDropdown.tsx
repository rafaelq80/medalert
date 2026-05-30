import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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

const styles = StyleSheet.create(theme => ({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  triggerText: {
    fontSize: 15,
    color: theme.inputText,
    flex: 1,
  },
  placeholder: {
    color: theme.inputPlaceholder,
  },
  arrow: {
    fontSize: 10,
    color: theme.onSurfaceVariant,
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  dropdown: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 12,
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
    borderBottomColor: theme.outlineVariant,
  },
  optionActive: {
    backgroundColor: theme.primaryContainer,
  },
  optionText: {
    fontSize: 15,
    color: theme.onSurface,
  },
  optionTextActive: {
    color: theme.onPrimary,
    fontWeight: '600',
  },
}));
