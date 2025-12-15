import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
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
  organization_id: string
}

export default function CallsHistoryScreen() {
  const router = useRouter()
  const [calls, setCalls] = useState<Call[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (organizationId) {
      loadCalls()
    }
  }, [organizationId])

  const loadUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error getting user:', userError)
        router.replace('/(auth)/login')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setLoading(false)
        return
      }

      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id)
      } else {
        console.warn('No organization_id found for user')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in loadUserData:', error)
      setLoading(false)
    }
  }

  const loadCalls = async () => {
    if (!organizationId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error loading calls:', error)
      setLoading(false)
      return
    }

    setCalls(data || [])
    setLoading(false)
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
      case 'completed':
      case 'answered':
        return '#4CAF50'
      case 'voicemail':
        return '#9C27B0'
      case 'no_answer':
        return '#F44336'
      default:
        return '#666'
    }
  }

  const renderCallItem = ({ item }: { item: Call }) => (
    <TouchableOpacity
      style={styles.callCard}
      onPress={() => router.push(`/call-detail/${item.id}`)}
    >
      <View style={styles.callHeader}>
        <View style={styles.callInfo}>
          <Ionicons
            name={item.direction === 'inbound' ? 'call-received' : 'call-made'}
            size={20}
            color={getStatusColor(item.status)}
          />
          <View style={styles.callDetails}>
            <Text style={styles.phoneNumber}>
              {item.from_number || 'Unknown'}
            </Text>
            <Text style={styles.callTime}>
              {format(new Date(item.created_at), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {item.summary && (
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
      )}
      <View style={styles.callFooter}>
        <Text style={styles.duration}>
          {formatDuration(item.duration_seconds)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading calls...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No calls yet</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
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
    marginBottom: 8,
  },
  callFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  duration: {
    fontSize: 12,
    color: '#999',
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
})

