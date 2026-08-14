import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { store } from './src/store';
import { AppProvider, useApp } from './src/context/AppContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { VehiclesScreen } from './src/screens/VehiclesScreen';
import { StaffScreen } from './src/screens/StaffScreen';
import { ApprovalsScreen } from './src/screens/ApprovalsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { loadAuthToken } from './src/services/api';

const Tab = createBottomTabNavigator();

const Tabs = () => {
  const { theme, isDark } = useApp();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Expenses" component={ExpensesScreen} />
        <Tab.Screen name="Vehicles" component={VehiclesScreen} />
        <Tab.Screen name="Staff" component={StaffScreen} />
        <Tab.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Approvals' }} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
    </>
  );
};

const AppContent = () => {
  const { theme } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: theme.colors.accent,
              background: theme.colors.background,
              card: theme.colors.surface,
              text: theme.colors.textPrimary,
              border: theme.colors.border,
              notification: theme.colors.accentDanger,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '800' },
            },
          }}
        >
          <Tabs />
        </NavigationContainer>
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});