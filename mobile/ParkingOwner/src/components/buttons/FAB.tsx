import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

interface FABProps {
  onPress: () => void;
}

export const FAB: React.FC<FABProps> = ({ onPress }) => {
  const { theme } = useApp();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.colors.accent },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.icon, { color: theme.colors.background }]}>+</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  icon: {
    fontSize: 24,
    fontWeight: '300',
  },
});