import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../badges/StatusBadge';

interface ListItemProps {
  title: string;
  subtitle?: string;
  amount?: number;
  status?: 'approved' | 'pending' | 'flagged' | 'paid' | 'overdue';
  onPress?: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  amount,
  status,
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leftContent}>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rightContent}>
        {amount !== undefined && (
          <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
            ₹{formatIndianNumber(amount)}
          </Text>
        )}
        {status && <StatusBadge status={status} />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 14,
    fontFamily: 'Menlo',
    fontWeight: '400',
    marginBottom: 4,
  },
});