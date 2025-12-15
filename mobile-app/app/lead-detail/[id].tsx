import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  status: string
  created_at: string
  notes: string | null
  organization_id: string
}

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
}

export default function LeadDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadLead()
    loadCalls()
  }, [id])

  const loadLead = async () => {
    if (!id) return

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error loading lead:', error)
      setLoading(false)
      return
    }

    setLead(data)
    setLoading(false)
  }

  const loadCalls = async () => {
    if (!id) return

    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading calls:', error)
      return
    }

    setCalls(data || [])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interested':
      case 'booked':
      case 'customer':
        return '#4CAF50'
      case 'new':
        return '#2196F3'
      case 'call_back':
        return '#FF9800'
      case 'not_interested':
        return '#F44336'
      default:
        return '#666'
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading lead details...</Text>
      </View>
    )
  }

  if (!lead) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Lead not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
      </View>

      <View style={styles.content}>
        {/* Lead Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{lead.name || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{lead.phone || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{lead.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(lead.status) }]}>
              <Text style={styles.badgeText}>{lead.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>
              {format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
        </View>

        {/* Notes Card */}
        {lead.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{lead.notes}</Text>
          </View>
        )}

        {/* Call History Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Call History ({calls.length})</Text>
          {calls.length === 0 ? (
            <Text style={styles.emptyText}>No calls recorded for this lead</Text>
          ) : (
            calls.map((call) => (
              <TouchableOpacity
                key={call.id}
                style={styles.callItem}
                onPress={() => router.push(`/call-detail/${call.id}`)}
              >
                <View style={styles.callItemHeader}>
                  <Ionicons
                    name={call.direction === 'inbound' ? 'call-received' : 'call-made'}
                    size={20}
                    color={call.direction === 'inbound' ? '#4CAF50' : '#2196F3'}
                  />
                  <View style={styles.callItemDetails}>
                    <Text style={styles.callItemPhone}>
                      {call.from_number || 'Unknown'}
                    </Text>
                    <Text style={styles.callItemTime}>
                      {format(new Date(call.created_at), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                  <View style={[styles.callStatusBadge, { backgroundColor: getStatusColor(call.status) }]}>
                    <Text style={styles.callStatusText}>{call.status}</Text>
                  </View>
                </View>
                {call.summary && (
                  <Text style={styles.callSummary} numberOfLines={2}>
                    {call.summary}
                  </Text>
                )}
                {call.duration_seconds && (
                  <Text style={styles.callDuration}>
                    Duration: {formatDuration(call.duration_seconds)}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    padding: 16,
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
  notesText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  callItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  callItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  callItemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  callItemPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  callItemTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  callStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  callStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  callSummary: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  callDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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

