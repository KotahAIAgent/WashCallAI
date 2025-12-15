import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import * as Notifications from 'expo-notifications'

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
  organization_id: string
}

export default function LiveCallsScreen() {
  const router = useRouter()
  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const processedCallIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    loadUserData()
    requestNotificationPermissions()
  }, [])

  useEffect(() => {
    if (!organizationId) return

    // Subscribe to new calls
    const channel = supabase
      .channel(`mobile-inbound-calls-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const call = payload.new as Call
          
          if (call.direction === 'inbound' && !processedCallIdsRef.current.has(call.id)) {
            processedCallIdsRef.current.add(call.id)
            
            // Show notification
            await sendNotification(call)
            
            // Update state
            setRecentCalls(prev => [call, ...prev].slice(0, 20))
            
            if (call.status === 'ringing' || call.status === 'in-progress') {
              setActiveCalls(prev => {
                const filtered = prev.filter(c => c.id !== call.id)
                return [call, ...filtered]
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const call = payload.new as Call
          
          // Update active calls
          setActiveCalls(prev => {
            const updated = prev.map(c => c.id === call.id ? call : c)
            // Remove if call is completed
            if (call.status === 'completed' || call.status === 'ended') {
              return updated.filter(c => c.id !== call.id)
            }
            return updated
          })
          
          // Update recent calls
          setRecentCalls(prev => 
            prev.map(c => c.id === call.id ? call : c)
          )
        }
      )
      .subscribe()

    // Load initial data
    loadCalls()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications to receive call alerts')
    }
  }

  const sendNotification = async (call: Call) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📞 New Inbound Call',
        body: `From: ${call.from_number || 'Unknown'}\nStatus: ${call.status}`,
        data: { callId: call.id },
        sound: true,
      },
      trigger: null, // Show immediately
    })
  }

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id)
    }
  }

  const loadCalls = async () => {
    if (!organizationId) return

    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error loading calls:', error)
      return
    }

    if (data) {
      const active = data.filter(c => 
        c.status === 'ringing' || c.status === 'in-progress' || c.status === 'calling'
      )
      setActiveCalls(active)
      setRecentCalls(data)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadCalls()
    setRefreshing(false)
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Active Calls Section */}
      {activeCalls.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔴 Active Calls</Text>
          {activeCalls.map((call) => (
            <TouchableOpacity
              key={call.id}
              style={styles.callCard}
              onPress={() => router.push(`/call-detail/${call.id}`)}
            >
              <View style={styles.callHeader}>
                <View style={styles.callInfo}>
                  <Ionicons name="call" size={24} color={getStatusColor(call.status)} />
                  <View style={styles.callDetails}>
                    <Text style={styles.phoneNumber}>
                      {call.from_number || 'Unknown'}
                    </Text>
                    <Text style={styles.callTime}>
                      {format(new Date(call.created_at), 'h:mm a')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(call.status) }]}>
                  <Text style={styles.statusText}>{call.status}</Text>
                </View>
              </View>
              {call.duration_seconds && (
                <Text style={styles.duration}>
                  Duration: {formatDuration(call.duration_seconds)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Calls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Inbound Calls</Text>
        {recentCalls.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No calls yet</Text>
            <Text style={styles.emptySubtext}>
              Inbound calls will appear here in real-time
            </Text>
          </View>
        ) : (
          recentCalls.map((call) => (
            <TouchableOpacity
              key={call.id}
              style={styles.callCard}
              onPress={() => router.push(`/call-detail/${call.id}`)}
            >
              <View style={styles.callHeader}>
                <View style={styles.callInfo}>
                  <Ionicons 
                    name={call.direction === 'inbound' ? 'call-received' : 'call-made'} 
                    size={20} 
                    color={getStatusColor(call.status)} 
                  />
                  <View style={styles.callDetails}>
                    <Text style={styles.phoneNumber}>
                      {call.from_number || 'Unknown'}
                    </Text>
                    <Text style={styles.callTime}>
                      {format(new Date(call.created_at), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(call.status) }]}>
                  <Text style={styles.statusText}>{call.status}</Text>
                </View>
              </View>
              {call.summary && (
                <Text style={styles.summary} numberOfLines={2}>
                  {call.summary}
                </Text>
              )}
              {call.duration_seconds && (
                <Text style={styles.duration}>
                  {formatDuration(call.duration_seconds)}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  callCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callDetails: {
    marginLeft: 12,
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  callTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summary: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  duration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
})
