import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApp, formatIndianNumber, formatTime } from '../context/AppContext';
import { ListItem } from '../components/lists/ListItem';
import { InputField } from '../components/inputs/InputField';
import { Button } from '../components/buttons/Button';
import QRCode from 'react-native-qrcode-svg';
import { fetchActiveVehicles, logEntry, logExit } from '../store/slices/vehiclesSlice';
import { fetchSlots } from '../store/slices/slotsSlice';
import { getPaymentSettings } from '../services/api';
import { buildUpiString } from '../utils/upi';
import { vehicleCategories } from '../utils/theme';
import { RootState, AppDispatch } from '../store';

export const VehiclesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useApp();
  const { activeVehicles, activeCount, currentEntry } = useSelector((state: RootState) => state.vehicles);
  const { slots, summary } = useSelector((state: RootState) => state.slots);
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [showExitSheet, setShowExitSheet] = useState(false);
  const [formData, setFormData] = useState({ vehicle_number: '', category: 'FOUR_WHEELER', slot_id: '' });
  const [upiVehicle, setUpiVehicle] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<{ upi_id: string; payee_name: string } | null>(null);

  useEffect(() => {
    dispatch(fetchActiveVehicles());
    dispatch(fetchSlots());
    getPaymentSettings().then(setPaymentSettings).catch(() => setPaymentSettings(null));
  }, [dispatch]);

  const handleEntry = async () => {
    if (!formData.vehicle_number || !formData.slot_id) return;
    await dispatch(logEntry(formData));
    setShowEntrySheet(false);
    setFormData({ vehicle_number: '', category: 'FOUR_WHEELER', slot_id: '' });
    dispatch(fetchSlots());
  };

  const handleExit = async (vehicleId: string, paymentMode: string) => {
    await dispatch(logExit({ id: vehicleId, payment_mode: paymentMode }));
    setShowExitSheet(false);
    setUpiVehicle(null);
    dispatch(fetchSlots());
  };

  const availableSlots = slots.filter(s => s.status === 'AVAILABLE');

  const renderUpiModal = () => {
    if (!upiVehicle || !paymentSettings?.upi_id) return null;
    const amount = upiVehicle.total_amount + upiVehicle.gst_amount;
    const upiString = buildUpiString({
      upi_id: paymentSettings.upi_id,
      payee_name: paymentSettings.payee_name,
      amount,
      note: `Parking ${upiVehicle.vehicle_number}`,
    });
    return (
      <Modal transparent visible animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.upsheet, { backgroundColor: theme.colors.surfaceElevated }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
              Pay via UPI
            </Text>
            <View style={styles.qrWrap}>
              <QRCode value={upiString} size={190} color="#000000" backgroundColor="#FFFFFF" />
            </View>
            <Text style={[styles.upiAmount, { color: theme.colors.textPrimary }]}>
              ₹{formatIndianNumber(amount)}
            </Text>
            <Text style={[styles.upiMeta, { color: theme.colors.textSecondary }]}>
              {upiVehicle.vehicle_number}
            </Text>
            <Text style={[styles.upiMeta, { color: theme.colors.textTertiary, fontFamily: 'Menlo' }]}>
              {paymentSettings.upi_id}
            </Text>
            <View style={styles.upiButtons}>
              <Button title="Cancel" variant="secondary" onPress={() => setUpiVehicle(null)} />
              <Button title="Payment Received" onPress={() => handleExit(upiVehicle.id, 'UPI')} />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.count, { color: theme.colors.textPrimary }]}>{activeCount}</Text>
        <Text style={[styles.countLabel, { color: theme.colors.textSecondary }]}>vehicles inside</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          onPress={() => setShowEntrySheet(true)}
        >
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>Log Entry ↑</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => setShowExitSheet(true)}
        >
          <Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>Log Exit ↓</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, { borderBottomColor: theme.colors.accent }]}>
          <Text style={[styles.tabText, { color: theme.colors.accent }]}>Active ({activeCount})</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.listContainer}>
        <View style={[styles.listCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {activeVehicles.map((vehicle) => (
            <Pressable key={vehicle.id} onPress={() => setShowExitSheet(true)}>
              <ListItem
                title={vehicle.vehicle_number}
                subtitle={`${vehicle.slot.slot_number} · ${formatTime(vehicle.entry_time)}`}
                amount={vehicle.total_amount + vehicle.gst_amount}
              />
            </Pressable>
          ))}
          {activeVehicles.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No active vehicles</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showEntrySheet && (
        <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>Log Vehicle Entry</Text>

          <InputField
            label="Vehicle Number"
            value={formData.vehicle_number}
            onChangeText={(vehicle_number) => setFormData({ ...formData, vehicle_number: vehicle_number.toUpperCase() })}
            autoCapitalize="characters"
          />

          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Category</Text>
          <View style={styles.categoryRow}>
            {Object.entries(vehicleCategories).map(([key, val]) => (
              <Pressable
                key={key}
                onPress={() => setFormData({ ...formData, category: key })}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: formData.category === key ? theme.colors.accent : theme.colors.surface,
                    borderColor: formData.category === key ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  { color: formData.category === key ? theme.colors.background : theme.colors.textPrimary }
                ]}>
                  {val.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Select Slot</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotPicker}>
            {availableSlots.slice(0, 20).map((slot) => (
              <Pressable
                key={slot.id}
                onPress={() => setFormData({ ...formData, slot_id: slot.id })}
                style={[
                  styles.slotChip,
                  {
                    backgroundColor: formData.slot_id === slot.id ? theme.colors.accentSuccess + '20' : theme.colors.surface,
                    borderColor: formData.slot_id === slot.id ? theme.colors.accentSuccess : theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.slotText, { color: theme.colors.textPrimary }]}>{slot.slot_number}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.exitButtonRow}>
            <Button title="Cancel" variant="secondary" onPress={() => setShowEntrySheet(false)} />
            <Button title="Log Entry" onPress={handleEntry} />
          </View>
        </View>
      )}

      {showExitSheet && (
        <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>Process Exit</Text>

          <ScrollView style={styles.vehicleList}>
            {activeVehicles.map((vehicle) => (
              <View key={vehicle.id} style={[styles.exitCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.exitInfo}>
                  <Text style={[styles.vehicleNumber, { color: theme.colors.textPrimary }]}>{vehicle.vehicle_number}</Text>
                  <Text style={[styles.vehicleMeta, { color: theme.colors.textSecondary }]}>
                    {vehicle.slot.slot_number} · {formatTime(vehicle.entry_time)}
                  </Text>
                </View>
                <View style={styles.exitAmount}>
                  <Text style={[styles.amountLabel, { color: theme.colors.textTertiary }]}>Amount</Text>
                  <Text style={[styles.amountValue, { color: theme.colors.textPrimary }]}>
                    ₹{formatIndianNumber(vehicle.total_amount + vehicle.gst_amount)}
                  </Text>
                </View>
                <View style={styles.paymentButtons}>
                  {['CASH', 'CARD'].map((mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => handleExit(vehicle.id, mode)}
                      style={[styles.payButton, { backgroundColor: theme.colors.accent }]}
                    >
                      <Text style={[styles.payButtonText, { color: theme.colors.background }]}>{mode}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => setUpiVehicle(vehicle)}
                    style={[styles.payButton, {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.accent,
                      borderWidth: 1,
                    }]}
                  >
                    <Text style={[styles.payButtonText, { color: theme.colors.accent }]}>UPI QR</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <Button title="Close" variant="ghost" onPress={() => setShowExitSheet(false)} />
        </View>
      )}

      {renderUpiModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  count: { fontSize: 72, fontWeight: '400', letterSpacing: -0.02 },
  countLabel: { fontSize: 14 },
  buttonRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 24, gap: 12 },
  button: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '500' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { paddingVertical: 8, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  listCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#3D3D3D', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '500', marginBottom: 16 },
  fieldLabel: { fontSize: 12, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryChip: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  categoryText: { fontSize: 14, fontWeight: '500' },
  slotPicker: { marginBottom: 16 },
  slotChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  slotText: { fontSize: 14 },
  exitButtonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  vehicleList: { maxHeight: 300, marginBottom: 16 },
  exitCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  exitInfo: { marginBottom: 8 },
  vehicleNumber: { fontSize: 16, fontWeight: '500', fontFamily: 'Menlo' },
  vehicleMeta: { fontSize: 12, marginTop: 2 },
  exitAmount: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amountLabel: { fontSize: 12 },
  amountValue: { fontSize: 18, fontFamily: 'Menlo', fontWeight: '500' },
  paymentButtons: { flexDirection: 'row', gap: 8 },
  payButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  payButtonText: { fontSize: 12, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  upsheet: { borderRadius: 20, padding: 24, alignItems: 'center' },
  qrWrap: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginTop: 8 },
  upiAmount: { fontSize: 28, fontFamily: 'Menlo', fontWeight: '600', marginTop: 16 },
  upiMeta: { fontSize: 12, marginTop: 4 },
  upiButtons: { flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' },
});