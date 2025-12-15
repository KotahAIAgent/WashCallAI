import { Redirect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })
  }, [])

  if (isAuthenticated === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
})
