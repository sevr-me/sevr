import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export function useAdmin(authUser) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const eventSourceRef = useRef(null)

  const isAdmin = authUser?.isAdmin

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/stats')
      if (response.ok) {
        setStats(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err)
    }
  }, [isAdmin])

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/users')
      if (response.ok) {
        setUsers(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err)
    }
  }, [isAdmin])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchUsers()])
    setLoading(false)
  }, [fetchStats, fetchUsers])

  // Connect to SSE activity feed
  const connectActivityFeed = useCallback(() => {
    if (!isAdmin) return

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Use fetch with EventSource workaround for auth headers
    const url = '/api/admin/activity'

    fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then(response => {
      if (!response.ok) {
        console.error('Failed to connect to activity feed')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type !== 'connected') {
                  setActivities(prev => [data, ...prev].slice(0, 50))
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      processStream().catch(console.error)

      // Store abort controller for cleanup
      eventSourceRef.current = { close: () => reader.cancel() }
    }).catch(err => {
      console.error('Activity feed connection error:', err)
    })
  }, [isAdmin])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    stats,
    users,
    activities,
    loading,
    refresh,
    connectActivityFeed,
    isAdmin,
  }
}
