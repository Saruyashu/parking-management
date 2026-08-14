import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useApp } from '../../context/AppContext';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isCurrency?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  isCurrency = false,
  value,
  ...props
}) => {
  const { theme } = useApp();
  const [isFocused, setIsFocused] = useState(false);

  const formatIndianNumber = (val: string): string => {
    const num = val.replace(/[^0-9]/g, '');
    if (num.length <= 3) return num;
    let result = num.slice(-3);
    let remaining = num.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    return remaining + ',' + result;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error
              ? theme.colors.accentDanger
              : isFocused
              ? theme.colors.accent
              : theme.colors.border,
            color: theme.colors.textPrimary,
          },
        ]}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={isCurrency && value ? formatIndianNumber(value.toString()) : value}
        keyboardType={isCurrency ? 'numeric' : props.keyboardType}
        {...props}
      />
      {error && <Text style={[styles.error, { color: theme.colors.accentDanger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});