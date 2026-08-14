import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApp, formatIndianNumber } from '../context/AppContext';
import { Button } from '../components/buttons/Button';
import { fetchExpenses, approveExpense, flagExpense } from '../store/slices/expensesSlice';
import { categories } from '../utils/theme';
import { RootState, AppDispatch } from '../store';

export const ApprovalsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useApp();
  const { pendingExpenses } = useSelector((state: RootState) => state.expenses);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  const handleApprove = async (id: string) => {
    await dispatch(approveExpense(id));
    setExpandedId(null);
  };

  const handleFlag = async (id: string) => {
    await dispatch(flagExpense({ id, reason: 'Needs correction' }));
    setExpandedId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Approvals</Text>
        <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
          {pendingExpenses.length} pending
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {pendingExpenses.map((expense) => {
          const isExpanded = expandedId === expense.id;
          const categoryColor = categories[expense.category as keyof typeof categories]?.color || '#636e72';

          return (
            <Pressable
              key={expense.id}
              onPress={() => setExpandedId(isExpanded ? null : expense.id)}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.dot, { backgroundColor: categoryColor }]} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                    {expense.description || expense.category}
                  </Text>
                  <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
                    {expense.vendor?.business_name || expense.created_by_user.name}
                  </Text>
                </View>
                <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
                  ₹{formatIndianNumber(expense.amount)}
                </Text>
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>Category</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                      {categories[expense.category as keyof typeof categories]?.label}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>Date</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>Payment</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                      {expense.payment_mode}
                    </Text>
                  </View>
                  {expense.attachments?.length > 0 && (
                    <View style={styles.attachmentRow}>
                      <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>Receipt</Text>
                      <Text style={[styles.attachmentText, { color: theme.colors.accentInfo }]}>
                        {expense.attachments.length} attachment(s)
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => handleFlag(expense.id)}
                      style={[styles.actionButton, { borderColor: theme.colors.accentDanger }]}
                    >
                      <Text style={[styles.flagText, { color: theme.colors.accentDanger }]}>Flag</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApprove(expense.id)}
                      style={[styles.actionButton, { backgroundColor: theme.colors.accentSuccess }]}
                    >
                      <Text style={[styles.approveText, { color: theme.colors.background }]}>Approve</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
        {pendingExpenses.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>All clear!</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No pending approvals</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '400' },
  count: { fontSize: 14 },
  list: { flex: 1, paddingHorizontal: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '500' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontFamily: 'Menlo', fontWeight: '500' },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: '500' },
  attachmentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  attachmentText: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  flagText: { fontSize: 14, fontWeight: '500' },
  approveText: { fontSize: 14, fontWeight: '500' },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 18, marginBottom: 8 },
  emptyText: { fontSize: 14 },
});