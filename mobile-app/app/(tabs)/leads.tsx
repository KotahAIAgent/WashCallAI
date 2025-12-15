import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
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

export default function LeadsScreen() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (organizationId) {
      loadLeads()
    }
  }, [organizationId, statusFilter])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/(auth)/login')
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

  const loadLeads = async () => {
    if (!organizationId) return

    setLoading(true)
    let query = supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading leads:', error)
      setLoading(false)
      return
    }

    setLeads(data || [])
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadLeads()
    setRefreshing(false)
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

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Interested', value: 'interested' },
    { label: 'Booked', value: 'booked' },
    { label: 'Callback', value: 'call_back' },
  ]

  const renderLeadItem = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => router.push(`/lead-detail/${item.id}`)}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Ionicons name="person" size={20} color={getStatusColor(item.status)} />
          <View style={styles.leadDetails}>
            <Text style={styles.leadName}>
              {item.name || item.phone || 'Unknown'}
            </Text>
            {item.phone && (
              <Text style={styles.leadPhone}>{item.phone}</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {item.email && (
        <Text style={styles.leadEmail}>{item.email}</Text>
      )}
      {item.notes && (
        <Text style={styles.leadNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
      <Text style={styles.leadTime}>
        {format(new Date(item.created_at), 'MMM d, h:mm a')}
      </Text>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading leads...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      <FlatList
        data={leads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No leads yet</Text>
            <Text style={styles.emptySubtext}>
              Leads will appear here when calls come in
            </Text>
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
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  leadCard: {
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
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leadDetails: {
    marginLeft: 12,
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  leadPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  leadEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  leadNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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
  leadTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
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

