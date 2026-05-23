import React, { useEffect } from 'react';
import { InteractionManager, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ItemsProvider } from './src/context/ItemsContext';
import { permissionsService } from './src/services/permissionsService';

// Ignore common warnings (optional but helpful in development)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

const App = () => {
  // Request permissions after app becomes interactive
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        await permissionsService.requestNotificationPermission();
      } catch (error) {
        // Silently fail - not critical for app startup
        console.log('Notification permission request failed (non-blocking)');
      }
    });

    return () => task.cancel?.();
  }, []);

  return (
    <AuthProvider>
      <ItemsProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ItemsProvider>
    </AuthProvider>
  );
};

export default App;