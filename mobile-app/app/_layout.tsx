import { Slot } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { SafeAreaProvider } from 'react-native-safe-area-context'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  )
}
