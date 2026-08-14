import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApp } from '../context/AppContext';
import { ListItem } from '../components/lists/ListItem';
import { Button } from '../components/buttons/Button';
import { StatusBadge } from '../components/badges/StatusBadge';
import { fetchStaff, fetchTodayAttendance, markAttendance } from '../store/slices/staffSlice';
import { RootState, AppDispatch } from '../store';

const shifts = ['MORNING', 'AFTERNOON', 'NIGHT'];

const statusColors: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: 'rgba(76, 175, 125, 0.12)', text: '#4CAF7D' },
  ABSENT: { bg: 'rgba(224, 90, 90, 0.12)', text: '#E05A5A' },
  HALF_DAY: { bg: 'rgba(212, 148, 74, 0.12)', text: '#D4944A' },
  LEAVE: { bg: 'rgba(90, 87, 84, 0.12)', text: '#5A5754' },
  NOT_MARKED: { bg: 'rgba(90, 87, 84, 0.12)', text: '#5A5754' },
};

export const StaffScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useApp();
  const { todayAttendance } = useSelector((state: RootState) => state.staff);
  const [activeShift, setActiveShift] = useState('MORNING');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTodayAttendance(activeShift));
  }, [dispatch, activeShift]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const handleMarkAttendance = async (staffId: string, status: string) => {
    await dispatch(markAttendance({
      staffId,
      data: {
        date: new Date().toISOString(),
        shift: activeShift,
        status,
      },
    }));
    setSelectedStaff(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.date, { color: theme.colors.textPrimary }]}>{dateStr}</Text>
        <View style={[styles.shiftFilter, { backgroundColor: theme.colors.surface }]}>
          {shifts.map((shift) => {
            const isActive = activeShift === shift;
            return (
              <Pressable
                key={shift}
                onPress={() => setActiveShift(shift)}
                style={[
                  styles.shiftPill,
                  {
                    backgroundColor: isActive ? theme.colors.accent : 'transparent',
                    borderColor: isActive ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.shiftText,
                    { color: isActive ? theme.colors.background : theme.colors.textSecondary },
                  ]}
                >
                  {shift.charAt(0) + shift.slice(1).toLowerCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.listContainer}>
        {todayAttendance
          .filter(s => s.shift === activeShift || activeShift === 'MORNING')
          .map((staff) => {
            const status = staff.todayAttendance?.status || 'NOT_MARKED';
            const statusConfig = statusColors[status];
            const isSelected = selectedStaff === staff.id;

            return (
              <View
                key={staff.id}
                style={[styles.staffCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Pressable onPress={() => setSelectedStaff(isSelected ? null : staff.id)}>
                  <View style={styles.staffRow}>
                    <View style={[styles.staffAvatar, { backgroundColor: theme.colors.accent + '20' }]}>
                      <Text style={[styles.avatarText, { color: theme.colors.accent }]}>
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={[styles.staffName, { color: theme.colors.textPrimary }]}>{staff.name}</Text>
                      <Text style={[styles.staffRole, { color: theme.colors.textSecondary }]}>
                        {staff.role} · ₹{staff.wage_rate.toLocaleString()}/{staff.is_monthly ? 'mo' : 'day'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Text style={[styles.statusText, { color: statusConfig.text }]}>
                        {status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {isSelected && (
                  <View style={styles.actionRow}>
                    {['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => handleMarkAttendance(staff.id, s)}
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: s === status ? theme.colors.accent : theme.colors.surfaceElevated,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionText,
                            { color: s === status ? theme.colors.background : theme.colors.textPrimary },
                          ]}
                        >
                          {s === 'PRESENT' ? '✓' : s === 'ABSENT' ? '✗' : s === 'HALF_DAY' ? '½' : '○'}{' '}
                          {s.replace('_', ' ')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        {todayAttendance.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No staff for this shift</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, alignItems: 'center' },
  date: { fontSize: 28, fontWeight: '400', marginBottom: 16 },
  shiftFilter: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  shiftPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginHorizontal: 2 },
  shiftText: { fontSize: 13, fontWeight: '500' },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  staffCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  staffRow: { flexDirection: 'row', alignItems: 'center' },
  staffAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '600' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '500' },
  staffRole: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.06 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  actionText: { fontSize: 11, fontWeight: '500' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});