import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * Requests push notification permissions and returns the Expo push token.
 * Returns null if permissions are denied or running on a simulator.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push notifications don't work on simulators
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MedAlert',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Sends the push token to the backend so the server can send notifications.
 * Should be called after a successful login.
 */
export async function registerPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (token) {
      await api.put('/usuarios/me/push-token', { push_token: token });
    }
  } catch {
    // Non-critical — don't block the user flow if push registration fails
  }
}

/**
 * Configures foreground notification handling and notification response listener.
 * Sets up the handler so notifications are displayed even when the app is in the foreground.
 * Returns a cleanup function to remove the response listener.
 */
export function setupNotificationHandlers(): () => void {
  // Show notifications when app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Listen for when user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('[MedAlert] Notification tapped:', response.notification.request.content);
    }
  );

  // Ensure Android notification channel is configured on app start
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'MedAlert',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return () => {
    responseSubscription.remove();
  };
}
