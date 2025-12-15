import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'

interface Call {
  id: string
  direction: 'inbound' | 'outbound'
  status: string
  from_number: string | null
  to_number: string | null
  created_at: string
  duration_seconds: number | null
  summary: string | null
  transcript: string | null
  recording_url: string | null
  organization_id: string
}

export default function CallDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [call, setCall] = useState<Call | null>(null)
  const [loading, setLoading] = useState(true)
  const insets = useSafeAreaInsets()
  const pathname = usePathname()

  useEffect(() => {
    if (!id) return

    loadCall()

    // Subscribe to updates
    const channel = supabase
      .channel(`call-detail-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setCall(payload.new as Call)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const loadCall = async () => {
    if (!id) return

    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error loading call:', error)
      setLoading(false)
      return
    }

    setCall(data)
    setLoading(false)
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing':
      case 'calling':
        return '#FFA500'
      case 'in-progress':
        return '#4CAF50'
      case 'completed':
      case 'answered':
        return '#2196F3'
      case 'voicemail':
        return '#9C27B0'
      case 'no_answer':
        return '#F44336'
      default:
        return '#666'
    }
  }

  const navigateToTab = (route: string) => {
    router.push(route as any)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading call details...</Text>
        </View>
        <BottomNavigation navigateToTab={navigateToTab} />
      </SafeAreaView>
    )
  }

  if (!call) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#999" />
          <Text style={styles.errorText}>Call not found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation navigateToTab={navigateToTab} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header with safe area top padding */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Call Details</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Call Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Direction</Text>
            <View style={[styles.badge, { backgroundColor: call.direction === 'inbound' ? '#4CAF50' : '#2196F3' }]}>
              <Text style={styles.badgeText}>
                {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(call.status) }]}>
              <Text style={styles.badgeText}>{call.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.value}>{call.from_number || 'Unknown'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.value}>{call.to_number || 'Unknown'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>
              {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{formatDuration(call.duration_seconds)}</Text>
          </View>
        </View>

        {/* Summary Card */}
        {call.summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.summaryText}>{call.summary}</Text>
          </View>
        )}

        {/* Transcript Card */}
        {call.transcript && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transcript</Text>
            <ScrollView style={styles.transcriptContainer}>
              <Text style={styles.transcriptText}>{call.transcript}</Text>
            </ScrollView>
          </View>
        )}

        {/* Recording Card */}
        {call.recording_url && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recording</Text>
            <TouchableOpacity
              style={styles.recordingButton}
              onPress={async () => {
                try {
                  const canOpen = await Linking.canOpenURL(call.recording_url!)
                  if (canOpen) {
                    await Linking.openURL(call.recording_url!)
                  } else {
                    Alert.alert('Error', 'Cannot open this URL')
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to open recording')
                }
              }}
            >
              <Ionicons name="play-circle" size={24} color="#000" />
              <View style={styles.recordingButtonText}>
                <Text style={styles.recordingButtonTitle}>Listen to Recording</Text>
                <Text style={styles.recordingButtonSubtitle}>Tap to open in browser</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </View>
      <BottomNavigation navigateToTab={navigateToTab} />
    </SafeAreaView>
  )
}

function BottomNavigation({ navigateToTab }: { navigateToTab: (route: string) => void }) {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => navigateToTab('/(tabs)/')}
      >
        <Ionicons name="call" size={24} color={pathname === '/(tabs)/' ? '#000' : '#666'} />
        <Text style={[styles.bottomNavLabel, { color: pathname === '/(tabs)/' ? '#000' : '#666' }]}>
          Live Calls
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => navigateToTab('/(tabs)/calls')}
      >
        <Ionicons name="list" size={24} color={pathname === '/(tabs)/calls' ? '#000' : '#666'} />
        <Text style={[styles.bottomNavLabel, { color: pathname === '/(tabs)/calls' ? '#000' : '#666' }]}>
          History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => navigateToTab('/(tabs)/leads')}
      >
        <Ionicons name="people" size={24} color={pathname === '/(tabs)/leads' ? '#000' : '#666'} />
        <Text style={[styles.bottomNavLabel, { color: pathname === '/(tabs)/leads' ? '#000' : '#666' }]}>
          Leads
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => navigateToTab('/(tabs)/dashboard')}
      >
        <Ionicons name="stats-chart" size={24} color={pathname === '/(tabs)/dashboard' ? '#000' : '#666'} />
        <Text style={[styles.bottomNavLabel, { color: pathname === '/(tabs)/dashboard' ? '#000' : '#666' }]}>
          Dashboard
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for bottom nav
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
    padding: 4, // Make tap area larger
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  bottomNavLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  transcriptContainer: {
    maxHeight: 300,
  },
  transcriptText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  recordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
  },
  recordingButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  recordingButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  recordingButtonSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

