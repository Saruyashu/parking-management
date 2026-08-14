import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useApp } from '../../context/AppContext';

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  change?: number;
  changeLabel?: string;
  onPress?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  prefix = '₹',
  change,
  changeLabel,
  onPress,
}) => {
  const { theme } = useApp();

  const formatIndianNumber = (num: number): string => {
    const str = num.toString();
    if (str.length <= 3) return str;
    let result = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    return remaining + ',' + result;
  };

  const displayValue = prefix === '₹' ? formatIndianNumber(value) : value.toString();

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textTertiary }]}>{label}</Text>
        <View style={styles.valueRow}>
          {prefix === '₹' && <Text style={[styles.rupee, { color: theme.colors.textPrimary }]}>₹</Text>}
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{displayValue}</Text>
        </View>
        {change !== undefined && (
          <View style={styles.changeRow}>
            <Text style={[styles.changeIcon, { color: change >= 0 ? theme.colors.accentSuccess : theme.colors.accentDanger }]}>
              {change >= 0 ? '▲' : '▼'}
            </Text>
            <Text style={[styles.changeText, { color: change >= 0 ? theme.colors.accentSuccess : theme.colors.accentDanger }]}>
              {Math.abs(change)}% {changeLabel || 'vs yesterday'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rupee: {
    fontSize: 28,
    fontWeight: '400',
    marginTop: 4,
    marginRight: 2,
  },
  value: {
    fontSize: 48,
    fontWeight: '400',
    letterSpacing: -0.02,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  changeText: {
    fontSize: 12,
  },
});