import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

type StatusType = 'approved' | 'pending' | 'flagged' | 'paid' | 'overdue';

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { bg: string; text: string; border: string; label: string }> = {
  approved: { bg: 'rgba(76, 175, 125, 0.12)', text: '#4CAF7D', border: 'rgba(76,175,125,0.25)', label: 'Approved' },
  pending: { bg: 'rgba(212, 148, 74, 0.12)', text: '#D4944A', border: 'rgba(212,148,74,0.25)', label: 'Pending' },
  flagged: { bg: 'rgba(224, 90, 90, 0.12)', text: '#E05A5A', border: 'rgba(224,90,90,0.25)', label: 'Flagged' },
  paid: { bg: 'rgba(76, 175, 125, 0.12)', text: '#4CAF7D', border: 'rgba(76,175,125,0.25)', label: 'Paid' },
  overdue: { bg: 'rgba(224, 90, 90, 0.12)', text: '#E05A5A', border: 'rgba(224,90,90,0.25)', label: 'Overdue' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.06,
    textTransform: 'uppercase',
  },
});