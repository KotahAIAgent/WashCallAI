import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

interface Stats {
  totalCalls: number
  inboundCalls: number
  outboundCalls: number
  totalLeads: number
  appointments: number
}

export default function DashboardScreen() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    totalLeads: 0,
    appointments: 0,
  })
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (organizationId) {
      loadStats()
    }
  }, [organizationId])

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

  const loadStats = async () => {
    if (!organizationId) return

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Load calls stats (last 7 days)
    const { data: calls } = await supabase
      .from('calls')
      .select('direction, status')
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString())

    // Load all calls for total
    const { data: allCalls } = await supabase
      .from('calls')
      .select('id')
      .eq('organization_id', organizationId)

    // Load leads stats
    const { data: leads } = await supabase
      .from('leads')
      .select('id, status')
      .eq('organization_id', organizationId)

    // Load appointments stats
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('organization_id', organizationId)

    if (calls) {
      const inbound = calls.filter(c => c.direction === 'inbound').length
      const outbound = calls.filter(c => c.direction === 'outbound').length
      const interested = leads?.filter(l => l.status === 'interested').length || 0
      
      setStats({
        totalCalls: allCalls?.length || 0,
        inboundCalls: inbound,
        outboundCalls: outbound,
        totalLeads: leads?.length || 0,
        appointments: appointments?.length || 0,
      })
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadStats()
    setRefreshing(false)
  }

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={32} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  )

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.statsGrid}>
          <StatCard
            icon="call"
            label="Total Calls"
            value={stats.totalCalls}
            color="#2196F3"
          />
          <StatCard
            icon="call-received"
            label="Inbound (7d)"
            value={stats.inboundCalls}
            color="#4CAF50"
          />
          <StatCard
            icon="call-made"
            label="Outbound (7d)"
            value={stats.outboundCalls}
            color="#FF9800"
          />
          <StatCard
            icon="people"
            label="Total Leads"
            value={stats.totalLeads}
            color="#9C27B0"
          />
          <StatCard
            icon="calendar"
            label="Appointments"
            value={stats.appointments}
            color="#F44336"
          />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Live Updates</Text>
            <Text style={styles.infoText}>
              Your calls are updated in real-time. Check the "Live Calls" tab to see active calls as they happen.
            </Text>
          </View>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    marginLeft: 16,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
})

