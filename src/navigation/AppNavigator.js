import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportItemScreen from '../screens/ReportItemScreen';
import SearchScreen from '../screens/SearchScreen';
import SavedItemsScreen from '../screens/SavedItemsScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import VerificationScreen from '../screens/VerificationScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountScreen from '../screens/AccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = ({ isAdmin }) => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#1a6edb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
      }}
    >
      {/* Home */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="home-outline" size={focused ? 26 : 24} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />

      {/* Search */}
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="magnify" size={focused ? 26 : 24} color={color} />
          ),
          tabBarLabel: 'Search',
        }}
      />

      {/* CENTER POST BUTTON */}
      <Tab.Screen
        name="Post"
        component={ReportItemScreen}
        options={{
          tabBarButton: (props) => (
            <Pressable
              style={styles.centerButton}
              onPress={props.onPress}
              android_ripple={{ color: 'rgba(26,110,219,0.3)', radius: 40 }}
            >
              <View style={styles.centerButtonInner}>
                <AppIcon name="plus" size={32} color="#ffffff" />
              </View>
            </Pressable>
          ),
        }}
      />

      {/* Chat */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="message-outline" size={focused ? 26 : 24} color={color} />
          ),
          tabBarLabel: 'Chat',
        }}
      />

      {/* Account / Profile */}
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="account-circle-outline" size={focused ? 26 : 24} color={color} />
          ),
          tabBarLabel: 'Profile',
        }}
      />

      {/* Admin (only for admins) */}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboardScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <AppIcon name="shield-account-outline" size={focused ? 26 : 24} color={color} />
            ),
            tabBarLabel: 'Admin',
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

const AppStack = ({ isAdmin }) => (
  <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShadowVisible: false }}>
    <Stack.Screen name="Main" options={{ headerShown: false }}>
      {() => <MainTabs isAdmin={isAdmin} />}
    </Stack.Screen>

    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
    <Stack.Screen name="Verify" component={VerificationScreen} options={{ title: 'Verify Ownership' }} />
    <Stack.Screen name="AlertsCenter" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="SavedItems" component={SavedItemsScreen} options={{ title: 'Saved Items' }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7fb' }}>
        <ActivityIndicator size="large" color="#1a6edb" />
      </View>
    );
  }

  return user ? <AppStack isAdmin={isAdmin} /> : <AuthStack />;
};

const styles = StyleSheet.create({
  centerButton: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a6edb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a6edb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default AppNavigator;