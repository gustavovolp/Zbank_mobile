import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string | undefined;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
}

export function SelectField({ label, value, options, onChange, placeholder = 'Selecione', error }: SelectFieldProps) {
  const [aberto, setAberto] = useState(false);
  const selecionado = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setAberto(true)}
        style={[styles.trigger, Boolean(error) && styles.triggerError]}
      >
        <Text style={selecionado ? styles.value : styles.placeholder}>
          {selecionado?.label ?? placeholder}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAberto(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item.value);
                    setAberto(false);
                  }}
                >
                  <Text style={[styles.optionLabel, item.value === value && styles.optionLabelSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { color: colors.neutral, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  trigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  triggerError: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.text },
  placeholder: { fontSize: 16, color: colors.textMuted },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  optionSelected: { backgroundColor: colors.background },
  optionLabel: { fontSize: 16, color: colors.text },
  optionLabelSelected: { color: colors.primary, fontWeight: '700' },
});
