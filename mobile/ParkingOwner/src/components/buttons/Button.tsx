import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useApp } from '../../context/AppContext';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  fullWidth = false,
  style,
}) => {
  const { theme } = useApp();

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.colors.accent };
      case 'secondary':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.borderActive };
      case 'destructive':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.accentDanger };
      case 'ghost':
        return { backgroundColor: 'transparent' };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: theme.colors.background };
      case 'secondary':
      case 'destructive':
      case 'ghost':
        return { color: theme.colors.textPrimary };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, getTextStyle()]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
});