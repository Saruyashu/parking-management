import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useApp } from '../../context/AppContext';

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'staff', label: 'Staff' },
  { key: 'reports', label: 'Reports' },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { theme } = useApp();
  const [indicatorPosition] = useState(0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={styles.tab}
          >
            {isActive && <View style={[styles.indicator, { backgroundColor: theme.colors.accent }]} />}
            <Text style={[styles.icon, { color: isActive ? theme.colors.accent : theme.colors.textTertiary }]}>
              {tab.key === 'home' ? '◉' : tab.key === 'expenses' ? '◎' : tab.key === 'vehicles' ? '◇' : tab.key === 'staff' ? '◯' : '▤'}
            </Text>
            {isActive && (
              <Text style={[styles.label, { color: theme.colors.accent }]}>{tab.label}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});