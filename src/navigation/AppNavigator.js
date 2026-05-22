import React from 'react';
import { ActivityIndicator, View } from 'react-native';
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

const TAB_META = {
  Home: { icon: 'home-outline', label: 'Home Feed' },
  Report: { icon: 'file-document-edit-outline', label: 'Report Item' },
  Search: { icon: 'magnify', label: 'Search' },
  Saved: { icon: 'bookmark-outline', label: 'Saved' },
  Alerts: { icon: 'bell-outline', label: 'Alerts' },
  Verify: { icon: 'shield-check-outline', label: 'Verify' },
  Account: { icon: 'account-circle-outline', label: 'Account' },
  Admin: { icon: 'shield-account-outline', label: 'Admin' },
};

const MainTabs = ({ isAdmin }) => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#f5f8ff' },
        headerShadowVisible: false,
        headerTintColor: '#1f2f56',
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#7e84a3',
        tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#d9dff2',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#ffffff',
        },
        tabBarIcon: ({ color, focused }) => (
          <AppIcon
            name={TAB_META[route.name]?.icon || 'circle-outline'}
            color={color}
            size={focused ? 22 : 20}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: TAB_META.Home.label }} />
      <Tab.Screen name="Report" component={ReportItemScreen} options={{ title: TAB_META.Report.label }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: TAB_META.Search.label }} />
      <Tab.Screen name="Saved" component={SavedItemsScreen} options={{ title: TAB_META.Saved.label }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{ title: TAB_META.Alerts.label }} />
      <Tab.Screen name="Verify" component={VerificationScreen} options={{ title: TAB_META.Verify.label }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: TAB_META.Account.label }} />
      {isAdmin && <Tab.Screen name="Admin" component={AdminDashboardScreen} options={{ title: TAB_META.Admin.label }} />}
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
  </Stack.Navigator>
);

const AppStack = ({ isAdmin }) => (
  <Stack.Navigator initialRouteName="Main">
    <Stack.Screen name="Main" options={{ headerShown: false }}>
      {() => <MainTabs isAdmin={isAdmin} />}
    </Stack.Screen>
    <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item Details' }} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <AppStack isAdmin={isAdmin} /> : <AuthStack />;
};

export default AppNavigator;
