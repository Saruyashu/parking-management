import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApp, formatIndianNumber, formatTime } from '../context/AppContext';
import { KPICard } from '../components/cards/KPICard';
import { ListItem } from '../components/lists/ListItem';
import { fetchDashboardOverview, fetchRecentActivity } from '../store/slices/dashboardSlice';
import { RootState, AppDispatch } from '../store';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useApp();
  const { overview, recentActivity, isLoading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardOverview());
    dispatch(fetchRecentActivity());
  }, [dispatch]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const handleRefresh = () => {
    dispatch(fetchDashboardOverview());
    dispatch(fetchRecentActivity());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Good morning</Text>
        <Text style={[styles.date, { color: theme.colors.textTertiary }]}>{dateStr}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
      >
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <KPICard
                label="Today's Revenue"
                value={overview?.today.revenue || 0}
                change={overview?.today.revenueChange}
              />
            </View>
            <View style={styles.kpiItem}>
              <KPICard
                label="Monthly Profit"
                value={overview?.month.profit || 0}
                change={12}
              />
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <Pressable onPress={() => navigation.navigate('Vehicles')}>
                <KPICard
                  label="Occupancy"
                  value={overview?.occupancy.percent || 0}
                  prefix=""
                  change={-3}
                />
              </Pressable>
            </View>
            <View style={styles.kpiItem}>
              <Pressable onPress={() => navigation.navigate('Approvals')}>
                <KPICard
                  label="Pending Approvals"
                  value={overview?.today.pendingExpenses || 0}
                  prefix=""
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Expenses')}
            >
              <Text style={[styles.actionIcon, { color: theme.colors.accentWarning }]}>+</Text>
              <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Log Expense</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Vehicles')}
            >
              <Text style={[styles.actionIcon, { color: theme.colors.accentSuccess }]}>↑</Text>
              <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Mark Entry</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Staff')}
            >
              <Text style={[styles.actionIcon, { color: theme.colors.accentInfo }]}>◯</Text>
              <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>Attendance</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Requires Attention</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertScroll}>
            {(overview?.alerts.expiringPasses || 0) > 0 && (
              <View style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.accentWarning }]}>
                <Text style={[styles.alertDot, { color: theme.colors.accentWarning }]}>●</Text>
                <Text style={[styles.alertText, { color: theme.colors.textPrimary }]}>
                  {overview?.alerts.expiringPasses} passes expiring
                </Text>
              </View>
            )}
            {(overview?.today.pendingExpenses || 0) > 0 && (
              <View style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.accentDanger }]}>
                <Text style={[styles.alertDot, { color: theme.colors.accentDanger }]}>●</Text>
                <Text style={[styles.alertText, { color: theme.colors.textPrimary }]}>
                  {overview?.today.pendingExpenses} pending approvals
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {recentActivity.slice(0, 5).map((activity, index) => (
              <View key={activity.id}>
                <ListItem
                  title={activity.title}
                  subtitle={`${activity.subtitle} · ${formatTime(activity.time)}`}
                  amount={activity.amount}
                  status={activity.type === 'expense' ? 'pending' : 'approved'}
                />
                {index < recentActivity.length - 1 && index < 4 && (
                  <View style={[styles.divider, { backgroundColor: theme.colors.surfaceElevated }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14 },
  date: { fontSize: 12, marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 16 },
  kpiGrid: { marginTop: 16 },
  kpiRow: { flexDirection: 'row', marginBottom: 12 },
  kpiItem: { flex: 1, marginHorizontal: 4 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { fontSize: 12, fontWeight: '500' },
  alertScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  alertCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, marginRight: 12 },
  alertDot: { fontSize: 10, marginRight: 8 },
  alertText: { fontSize: 13 },
  activityCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginLeft: 36 },
});