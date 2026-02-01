import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function useSearchQueries() {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Track which queries are enabled (stored locally)
  const [enabledIds, setEnabledIds] = useState(() => {
    const saved = localStorage.getItem('sevr-enabled-queries')
    return saved ? new Set(JSON.parse(saved)) : null // null means "all enabled" (default)
  })

  // Fetch queries on mount
  const fetchQueries = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/queries', { headers })
      if (res.ok) {
        setQueries(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueries()
  }, [fetchQueries])

  // Save enabled IDs to localStorage
  useEffect(() => {
    if (enabledIds === null) {
      localStorage.removeItem('sevr-enabled-queries')
    } else {
      localStorage.setItem('sevr-enabled-queries', JSON.stringify([...enabledIds]))
    }
  }, [enabledIds])

  const addQuery = useCallback(async (query) => {
    setError(null)
    try {
      const response = await api('/api/queries', {
        method: 'POST',
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const newQuery = await response.json()
        setQueries(prev => [...prev, newQuery])
        // Auto-enable newly added queries
        if (enabledIds !== null) {
          setEnabledIds(prev => new Set([...prev, newQuery.id]))
        }
        return true
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add query')
        return false
      }
    } catch (err) {
      setError('Failed to add query')
      return false
    }
  }, [enabledIds])

  // Track hits for queries after scanning
  const trackHits = useCallback(async (hits) => {
    if (!hits || hits.length === 0) return
    try {
      await fetch('/api/queries/hits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hits }),
      })
    } catch (err) {
      console.error('Failed to track query hits:', err)
    }
  }, [])

  const toggleQuery = useCallback((id) => {
    setEnabledIds(prev => {
      // If null (all enabled), create a set with all IDs except this one
      if (prev === null) {
        const allIds = new Set(queries.map(q => q.id))
        allIds.delete(id)
        return allIds
      }
      // Otherwise toggle the ID
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [queries])

  const selectAll = useCallback(() => {
    setEnabledIds(null) // null means all enabled
  }, [])

  const selectNone = useCallback(() => {
    setEnabledIds(new Set())
  }, [])

  // Check if a query is enabled
  const isEnabled = useCallback((id) => {
    return enabledIds === null || enabledIds.has(id)
  }, [enabledIds])

  // Return only enabled queries for use in scanning
  const enabledQueries = queries.filter(q => isEnabled(q.id))
  const queryStrings = enabledQueries.map(q => q.query)

  const enabledCount = enabledIds === null ? queries.length : enabledIds.size

  return {
    queries,
    queryStrings,
    enabledQueries,
    loading,
    error,
    setError,
    addQuery,
    toggleQuery,
    selectAll,
    selectNone,
    isEnabled,
    enabledCount,
    trackHits,
    refetch: fetchQueries,
  }
}
