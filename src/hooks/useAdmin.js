import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export function useAdmin(authUser) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [guides, setGuides] = useState([])
  const [queries, setQueries] = useState([])
  const [blacklist, setBlacklist] = useState([])
  const [activities, setActivities] = useState([])
  const [usersOverTime, setUsersOverTime] = useState([])
  const [usersByCountry, setUsersByCountry] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const eventSourceRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)

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

  const fetchGuides = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/guides')
      if (response.ok) {
        setGuides(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch admin guides:', err)
    }
  }, [isAdmin])

  const fetchBlacklist = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/blacklist')
      if (response.ok) {
        setBlacklist(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch blacklist:', err)
    }
  }, [isAdmin])

  const fetchQueries = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/queries')
      if (response.ok) {
        setQueries(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err)
    }
  }, [isAdmin])

  const fetchUsersOverTime = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/users-over-time')
      if (response.ok) {
        setUsersOverTime(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch users over time:', err)
    }
  }, [isAdmin])

  const fetchUsersByCountry = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await api('/api/admin/users-by-country')
      if (response.ok) {
        setUsersByCountry(await response.json())
      }
    } catch (err) {
      console.error('Failed to fetch users by country:', err)
    }
  }, [isAdmin])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchGuides(),
      fetchQueries(),
      fetchBlacklist(),
      fetchUsersOverTime(),
      fetchUsersByCountry(),
    ])
    setLoading(false)
  }, [fetchStats, fetchUsers, fetchGuides, fetchQueries, fetchBlacklist, fetchUsersOverTime, fetchUsersByCountry])

  // Admin actions
  const deleteGuide = useCallback(async (domain) => {
    try {
      const response = await api(`/api/admin/guides/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchGuides()
        await fetchStats()
        return true
      }
    } catch (err) {
      console.error('Failed to delete guide:', err)
    }
    return false
  }, [fetchGuides, fetchStats])

  const updateGuide = useCallback(async (domain, content, settingsUrl, noChangePossible) => {
    try {
      const response = await api(`/api/admin/guides/${encodeURIComponent(domain)}`, {
        method: 'PUT',
        body: JSON.stringify({ content, settingsUrl, noChangePossible }),
      })
      if (response.ok) {
        await fetchGuides()
        return true
      }
    } catch (err) {
      console.error('Failed to update guide:', err)
    }
    return false
  }, [fetchGuides])

  const deleteUser = useCallback(async (userId) => {
    try {
      const response = await api(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchUsers()
        await fetchStats()
        return true
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
    return false
  }, [fetchUsers, fetchStats])

  const addToBlacklist = useCallback(async (email, reason) => {
    try {
      const response = await api('/api/admin/blacklist', {
        method: 'POST',
        body: JSON.stringify({ email, reason }),
      })
      if (response.ok) {
        await fetchBlacklist()
        return true
      }
    } catch (err) {
      console.error('Failed to add to blacklist:', err)
    }
    return false
  }, [fetchBlacklist])

  const removeFromBlacklist = useCallback(async (email) => {
    try {
      const response = await api(`/api/admin/blacklist/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchBlacklist()
        return true
      }
    } catch (err) {
      console.error('Failed to remove from blacklist:', err)
    }
    return false
  }, [fetchBlacklist])

  const deleteQuery = useCallback(async (id) => {
    try {
      const response = await api(`/api/admin/queries/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchQueries()
        return true
      }
    } catch (err) {
      console.error('Failed to delete query:', err)
    }
    return false
  }, [fetchQueries])

  const approveQuery = useCallback(async (id) => {
    try {
      const response = await api(`/api/admin/queries/${id}/approve`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchQueries()
        return true
      }
    } catch (err) {
      console.error('Failed to approve query:', err)
    }
    return false
  }, [fetchQueries])

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
                if (data.type === 'online_users') {
                  setOnlineUsers(data.users || [])
                } else if (data.type !== 'connected') {
                  setActivities(prev => [data, ...prev].slice(0, 50))
                  // Refresh stats when new signup occurs
                  if (data.type === 'signup') {
                    fetchStats()
                    fetchUsers()
                    fetchUsersOverTime()
                    fetchUsersByCountry()
                  }
                  // Refresh guides when guide is edited
                  if (data.type === 'guide_edit') {
                    fetchGuides()
                  }
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
  }, [isAdmin, fetchStats, fetchUsers, fetchUsersOverTime, fetchUsersByCountry, fetchGuides])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [])

  return {
    stats,
    users,
    guides,
    queries,
    blacklist,
    activities,
    usersOverTime,
    usersByCountry,
    onlineUsers,
    loading,
    refresh,
    connectActivityFeed,
    isAdmin,
    // Actions
    deleteGuide,
    updateGuide,
    deleteUser,
    addToBlacklist,
    removeFromBlacklist,
    deleteQuery,
    approveQuery,
  }
}
