import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApp, formatIndianNumber, formatDate } from '../context/AppContext';
import { ListItem } from '../components/lists/ListItem';
import { FAB } from '../components/buttons/FAB';
import { InputField } from '../components/inputs/InputField';
import { Button } from '../components/buttons/Button';
import { StatusBadge } from '../components/badges/StatusBadge';
import { fetchExpenses, createExpense, fetchPendingExpenses } from '../store/slices/expensesSlice';
import { categories } from '../utils/theme';
import { RootState, AppDispatch } from '../store';

const filterOptions = ['All', 'STAFF_WAGES', 'UTILITIES', 'MAINTENANCE', 'SECURITY', 'Pending'];

export const ExpensesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useApp();
  const { expenses, summary, isLoading } = useSelector((state: RootState) => state.expenses);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    payment_mode: 'CASH',
    description: '',
    date: new Date().toISOString(),
  });

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchPendingExpenses());
  }, [dispatch]);

  const filteredExpenses = activeFilter === 'All'
    ? expenses
    : activeFilter === 'Pending'
    ? expenses.filter(e => e.status === 'PENDING')
    : expenses.filter(e => e.category === activeFilter);

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount) return;

    await dispatch(createExpense({
      date: formData.date,
      category: formData.category,
      amount: parseInt(formData.amount) * 100,
      payment_mode: formData.payment_mode,
      description: formData.description,
    }));
    setShowAddSheet(false);
    setFormData({ category: '', amount: '', payment_mode: 'CASH', description: '', date: new Date().toISOString() });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Expenses</Text>
        <Text style={[styles.total, { color: theme.colors.textSecondary }]}>
          Total: ₹{formatIndianNumber(summary.total)}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isActive ? theme.colors.accent : 'transparent',
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? theme.colors.background : theme.colors.textSecondary },
                ]}
              >
                {filter === 'All' ? 'All' : filter === 'STAFF_WAGES' ? 'Staff' : filter === 'UTILITIES' ? 'Utilities' : filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.listContainer, { backgroundColor: theme.colors.surface }]}>
        {filteredExpenses.map((expense) => (
          <Pressable key={expense.id} onPress={() => navigation.navigate('ExpenseDetail', { expense })}>
            <ListItem
              title={expense.description || categories[expense.category as keyof typeof categories]?.label || expense.category}
              subtitle={`${formatDate(expense.date)} · ${expense.vendor?.business_name || expense.created_by_user.name}`}
              amount={expense.amount}
              status={expense.status as 'approved' | 'pending' | 'flagged'}
            />
          </Pressable>
        ))}
      </View>

      <FAB onPress={() => setShowAddSheet(true)} />

      {showAddSheet && (
        <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>Log Expense</Text>

          <ScrollView style={styles.form}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
              {Object.entries(categories).map(([key, val]) => (
                <Pressable
                  key={key}
                  onPress={() => setFormData({ ...formData, category: key })}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: formData.category === key ? val.color + '20' : theme.colors.surface,
                      borderColor: formData.category === key ? val.color : theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.categoryDot, { backgroundColor: val.color }]} />
                  <Text style={[styles.categoryLabel, { color: theme.colors.textPrimary }]}>{val.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <InputField
              label="Amount (₹)"
              value={formData.amount}
              onChangeText={(amount) => setFormData({ ...formData, amount })}
              isCurrency
              keyboardType="numeric"
            />

            <InputField
              label="Description"
              value={formData.description}
              onChangeText={(description) => setFormData({ ...formData, description })}
              multiline
            />

            <View style={styles.paymentModeRow}>
              {['CASH', 'UPI', 'BANK_TRANSFER'].map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setFormData({ ...formData, payment_mode: mode })}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor: formData.payment_mode === mode ? theme.colors.accent : theme.colors.surface,
                      borderColor: formData.payment_mode === mode ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.modeText,
                    { color: formData.payment_mode === mode ? theme.colors.background : theme.colors.textSecondary }
                  ]}>
                    {mode.replace('_', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowAddSheet(false)} />
              <Button title="Submit" onPress={handleSubmit} />
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '400' },
  total: { fontSize: 14 },
  filterBar: { paddingHorizontal: 16, marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '500' },
  listContainer: { flex: 1, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#3D3D3D', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '500', marginBottom: 16 },
  form: { maxHeight: 400 },
  fieldLabel: { fontSize: 12, marginBottom: 8 },
  categoryPicker: { marginBottom: 16 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8, alignItems: 'center', minWidth: 80 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  categoryLabel: { fontSize: 11 },
  paymentModeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  modeText: { fontSize: 12, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
});