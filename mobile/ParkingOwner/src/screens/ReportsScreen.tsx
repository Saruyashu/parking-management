import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApp, formatIndianNumber, formatDate } from '../context/AppContext';
import { KPICard } from '../components/cards/KPICard';
import { getMonthlyReport, getDailyReport } from '../services/api';
import { RootState, AppDispatch } from '../store';

const datePresets = ['Today', 'This Week', 'This Month', 'Custom'];

export const ReportsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, toggleTheme, isDark } = useApp();
  const { overview } = useSelector((state: RootState) => state.dashboard);
  const [activePreset, setActivePreset] = useState('This Month');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [activePreset]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activePreset === 'Today') {
        const data = await getDailyReport();
        setReportData(data);
      } else {
        const data = await getMonthlyReport();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    }
    setLoading(false);
  };

  const revenue = reportData?.revenue?.total || overview?.month.revenue || 0;
  const expenses = reportData?.expenses?.total || overview?.month.expenses || 0;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

  const expensesByCategory = reportData?.expenses?.byCategory || {};

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Reports</Text>
        <Pressable onPress={toggleTheme} style={[styles.themeToggle, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.textSecondary }}>{isDark ? '☀' : '☾'}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetBar}>
        {datePresets.map((preset) => {
          const isActive = activePreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => setActivePreset(preset)}
              style={[
                styles.presetPill,
                {
                  backgroundColor: isActive ? theme.colors.accent : 'transparent',
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: isActive ? theme.colors.background : theme.colors.textSecondary },
                ]}
              >
                {preset}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.plCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.plRow}>
            <View style={styles.plItem}>
              <Text style={[styles.plLabel, { color: theme.colors.textTertiary }]}>Revenue</Text>
              <Text style={[styles.plValue, { color: theme.colors.accentSuccess }]}>
                ₹{formatIndianNumber(revenue)}
              </Text>
            </View>
            <View style={styles.plItem}>
              <Text style={[styles.plLabel, { color: theme.colors.textTertiary }]}>Expenses</Text>
              <Text style={[styles.plValue, { color: theme.colors.accentWarning }]}>
                ₹{formatIndianNumber(expenses)}
              </Text>
            </View>
          </View>
          <View style={[styles.plDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.profitRow}>
            <View>
              <Text style={[styles.profitLabel, { color: theme.colors.textSecondary }]}>Profit</Text>
              <View style={styles.profitValueRow}>
                <Text
                  style={[
                    styles.profitValue,
                    { color: profit >= 0 ? theme.colors.accentSuccess : theme.colors.accentDanger },
                  ]}
                >
                  {profit >= 0 ? '' : '−'}₹{formatIndianNumber(Math.abs(profit))}
                </Text>
              </View>
            </View>
            <View style={[styles.marginBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
              <Text style={[styles.marginText, { color: theme.colors.textSecondary }]}>{margin}% margin</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Revenue vs Expenses</Text>
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.barChart}>
              <View style={styles.barContainer}>
                <View style={[styles.barWrapper]}>
                  <View
                    style={[
                      styles.bar,
                      styles.revenueBar,
                      { backgroundColor: theme.colors.accentSuccess, height: `${Math.min((revenue / (revenue + expenses || 1)) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <View style={[styles.barWrapper]}>
                  <View
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      { backgroundColor: theme.colors.accent, height: `${Math.min((expenses / (revenue + expenses || 1)) * 100, 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.barLabels}>
                <Text style={[styles.barLabel, { color: theme.colors.textTertiary }]}>Revenue</Text>
                <Text style={[styles.barLabel, { color: theme.colors.textTertiary }]}>Expenses</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Expense Breakdown</Text>
          <View style={[styles.breakdownCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.donutPlaceholder}>
              <Text style={[styles.donutCenter, { color: theme.colors.textPrimary }]}>
                ₹{formatIndianNumber(expenses)}
              </Text>
              <Text style={[styles.donutLabel, { color: theme.colors.textTertiary }]}>Total Expenses</Text>
            </View>
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <View key={category} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={[styles.categoryLabel, { color: theme.colors.textPrimary }]}>
                    {category.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[styles.categoryAmount, { color: theme.colors.textPrimary }]}>
                  ₹{formatIndianNumber(amount as number)}
                </Text>
              </View>
            ))}
            {Object.keys(expensesByCategory).length === 0 && (
              <Text style={[styles.noDataText, { color: theme.colors.textTertiary }]}>No expense data available</Text>
            )}
          </View>
        </View>

        <Pressable style={[styles.exportButton, { borderColor: theme.colors.border }]}>
          <Text style={[styles.exportText, { color: theme.colors.textSecondary }]}>Export Report →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    STAFF_WAGES: '#7B68EE',
    UTILITIES: '#4ECDC4',
    MAINTENANCE: '#F7B731',
    SECURITY: '#5A8FBF',
    RENT_LEASE: '#A29BFE',
    EQUIPMENT: '#E17055',
    VENDOR: '#FD79A8',
    TAX_LICENSE: '#00B894',
    SOFTWARE: '#636E72',
    INSURANCE: '#FDCB6E',
    MISCELLANEOUS: '#B2BEC3',
  };
  return colors[category] || '#636e72';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '400' },
  themeToggle: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  presetBar: { paddingHorizontal: 16, marginBottom: 16 },
  presetPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  presetText: { fontSize: 13, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16 },
  plCard: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  plRow: { flexDirection: 'row', justifyContent: 'space-between' },
  plItem: {},
  plLabel: { fontSize: 11, fontWeight: '400', letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 4 },
  plValue: { fontSize: 28, fontWeight: '400' },
  plDivider: { height: 1, marginVertical: 16 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  profitLabel: { fontSize: 12, marginBottom: 2 },
  profitValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  profitValue: { fontSize: 24, fontWeight: '500' },
  marginBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  marginText: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '400', letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 12 },
  chartCard: { padding: 20, borderRadius: 12, borderWidth: 1 },
  barChart: { marginBottom: 16 },
  barContainer: { flexDirection: 'row', height: 120, gap: 24, justifyContent: 'center' },
  barWrapper: { flex: 1, maxWidth: 100, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 8 },
  revenueBar: {},
  expenseBar: {},
  barLabels: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 8 },
  barLabel: { fontSize: 11 },
  breakdownCard: { padding: 20, borderRadius: 12, borderWidth: 1 },
  donutPlaceholder: { alignItems: 'center', marginBottom: 20 },
  donutCenter: { fontSize: 28, fontWeight: '400' },
  donutLabel: { fontSize: 12, marginTop: 4 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  categoryLabel: { fontSize: 14 },
  categoryAmount: { fontSize: 14, fontFamily: 'Menlo' },
  noDataText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  exportButton: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, marginTop: 8 },
  exportText: { fontSize: 14 },
});