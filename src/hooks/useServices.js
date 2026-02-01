import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { extractServiceInfo } from '@/lib/gmail'

// Fuzzy match function - returns score (higher = better match), or -1 for no match
function fuzzyMatch(pattern, text) {
  if (!pattern) return 0
  pattern = pattern.toLowerCase()
  text = text.toLowerCase()

  let patternIdx = 0
  let score = 0
  let lastMatchIdx = -1

  for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
    if (text[i] === pattern[patternIdx]) {
      // Bonus for consecutive matches
      if (lastMatchIdx === i - 1) {
        score += 2
      } else {
        score += 1
      }
      // Bonus for matching at start of word
      if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '.' || text[i - 1] === '-' || text[i - 1] === '_') {
        score += 2
      }
      lastMatchIdx = i
      patternIdx++
    }
  }

  // All pattern characters must match
  return patternIdx === pattern.length ? score : -1
}

export function useServices(encryptionKey, encryptionStatus, saveEncryptedServices, searchQueries = []) {
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('sevr-services')
    return saved ? JSON.parse(saved) : []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: '' })
  const [error, setError] = useState(null)
  const [spamToEnd, setSpamToEnd] = useState(true)
  const [inactiveYears, setInactiveYears] = useState(2)
  const [hideInactive, setHideInactive] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lastSelectedId, setLastSelectedId] = useState(null)

  // Save to localStorage and optionally to encrypted server storage
  const saveServices = useCallback((newServices) => {
    localStorage.setItem('sevr-services', JSON.stringify(newServices))

    if (encryptionKey && encryptionStatus === 'unlocked' && newServices.length > 0) {
      saveEncryptedServices(encryptionKey, newServices)
    }
  }, [encryptionKey, encryptionStatus, saveEncryptedServices])

  // Update service on backend
  const updateServiceOnBackend = useCallback(async (serviceId, migrated) => {
    try {
      await api(`/api/services/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ migrated }),
      })
    } catch (err) {
      console.error('Failed to update service on backend:', err)
    }
  }, [])

  const scanGmail = useCallback(async (accessToken) => {
    if (!accessToken) return
    if (searchQueries.length === 0) {
      setError('No search queries configured')
      return
    }

    setIsLoading(true)
    setError(null)
    setScanProgress({ current: 0, total: searchQueries.length, status: 'Starting scan...' })

    const foundServices = new Map()

    try {
      for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i]
        setScanProgress({
          current: i + 1,
          total: searchQueries.length,
          status: `Searching: ${query.replace('subject:', '')}`
        })

        const searchResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        if (!searchResponse.ok) {
          throw new Error(`Gmail API error: ${searchResponse.status}`)
        }

        const searchData = await searchResponse.json()
        const messages = searchData.messages || []

        for (let j = 0; j < messages.length; j += 10) {
          const batch = messages.slice(j, j + 10)

          const details = await Promise.all(
            batch.map(msg =>
              fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              ).then(r => r.json())
            )
          )

          for (const message of details) {
            const serviceInfo = extractServiceInfo(message)
            const key = serviceInfo.domain

            const messageDate = parseInt(message.internalDate, 10)
            if (!foundServices.has(key)) {
              foundServices.set(key, {
                ...serviceInfo,
                id: key,
                migrated: false,
                firstSeen: messageDate,
                lastSeen: messageDate,
                count: 1,
                isSpam: false,
              })
            } else {
              const existing = foundServices.get(key)
              existing.count++
              if (messageDate > existing.lastSeen) {
                existing.lastSeen = messageDate
              }
              if (messageDate < existing.firstSeen) {
                existing.firstSeen = messageDate
              }
            }
          }
        }

        await new Promise(r => setTimeout(r, 100))
      }

      // Second pass: get most recent email from each domain
      const domains = Array.from(foundServices.keys())
      setScanProgress({
        current: 0,
        total: domains.length,
        status: 'Checking last activity for each service...'
      })

      for (let i = 0; i < domains.length; i += 5) {
        const batch = domains.slice(i, i + 5)

        await Promise.all(batch.map(async (domain) => {
          try {
            const recentResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(`from:${domain}`)}&maxResults=1`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )

            if (recentResponse.ok) {
              const recentData = await recentResponse.json()
              if (recentData.messages?.length > 0) {
                const msgResponse = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${recentData.messages[0].id}?format=minimal`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                )
                if (msgResponse.ok) {
                  const msgData = await msgResponse.json()
                  const service = foundServices.get(domain)
                  service.lastSeen = parseInt(msgData.internalDate, 10)
                }
              }
            }
          } catch (err) {
            console.error(`Failed to get recent activity for ${domain}:`, err)
          }
        }))

        setScanProgress({
          current: Math.min(i + 5, domains.length),
          total: domains.length,
          status: 'Checking last activity for each service...'
        })

        await new Promise(r => setTimeout(r, 100))
      }

      // Merge with existing services (preserve migration status)
      const mergedServices = []
      const prevMap = new Map(services.map(s => [s.domain || s.id, s]))

      for (const [key, service] of foundServices) {
        const existing = prevMap.get(key)
        mergedServices.push({
          ...service,
          migrated: existing?.migrated || false,
          ignored: existing?.ignored || false,
          important: existing?.important || false,
        })
      }

      mergedServices.sort((a, b) => (b.count || 0) - (a.count || 0))

      setServices(mergedServices)
      saveServices(mergedServices)

      setScanProgress({ current: searchQueries.length, total: searchQueries.length, status: 'Scan complete!' })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [services, saveServices, searchQueries])

  const toggleMigrated = useCallback((serviceId) => {
    setServices(prev => {
      const updated = prev.map(s =>
        s.id === serviceId ? { ...s, migrated: !s.migrated } : s
      )
      const service = updated.find(s => s.id === serviceId)
      if (service) {
        updateServiceOnBackend(serviceId, service.migrated)
      }
      saveServices(updated)
      return updated
    })
  }, [updateServiceOnBackend, saveServices])

  // Selection handlers
  const handleSelect = useCallback((serviceId, sortedServices, shiftKey) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)

      if (shiftKey && lastSelectedId && sortedServices) {
        // Range selection
        const ids = sortedServices.map(s => s.id)
        const startIdx = ids.indexOf(lastSelectedId)
        const endIdx = ids.indexOf(serviceId)

        if (startIdx !== -1 && endIdx !== -1) {
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
          for (let i = from; i <= to; i++) {
            newSet.add(ids[i])
          }
        }
      } else {
        // Toggle single selection
        if (newSet.has(serviceId)) {
          newSet.delete(serviceId)
        } else {
          newSet.add(serviceId)
        }
      }

      return newSet
    })
    setLastSelectedId(serviceId)
  }, [lastSelectedId])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedId(null)
  }, [])

  const selectAll = useCallback((sortedServices) => {
    setSelectedIds(new Set(sortedServices.map(s => s.id)))
  }, [])

  // Bulk actions
  const setMigratedBulk = useCallback((migrated) => {
    setServices(prev => {
      const updated = prev.map(s =>
        selectedIds.has(s.id) ? { ...s, migrated } : s
      )
      saveServices(updated)
      return updated
    })
    clearSelection()
  }, [selectedIds, saveServices, clearSelection])

  const setIgnoredBulk = useCallback((ignored) => {
    setServices(prev => {
      const updated = prev.map(s =>
        selectedIds.has(s.id) ? { ...s, ignored } : s
      )
      saveServices(updated)
      return updated
    })
    clearSelection()
  }, [selectedIds, saveServices, clearSelection])

  const setImportantBulk = useCallback((important) => {
    setServices(prev => {
      const updated = prev.map(s =>
        selectedIds.has(s.id) ? { ...s, important } : s
      )
      saveServices(updated)
      return updated
    })
    clearSelection()
  }, [selectedIds, saveServices, clearSelection])

  const clearServices = useCallback(() => {
    if (confirm('Clear all discovered services? This cannot be undone.')) {
      setServices([])
      localStorage.removeItem('sevr-services')
    }
  }, [])

  const exportServices = useCallback(() => {
    const data = JSON.stringify(services, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sevr-services.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [services])

  const isInactive = useCallback((service) => {
    if (!service.lastSeen) return false
    const lastSeenDate = new Date(service.lastSeen)
    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - inactiveYears)
    return lastSeenDate < cutoffDate
  }, [inactiveYears])

  // Sort and filter services for display
  const getSortedServices = useCallback(() => {
    let filtered = [...services].map(s => ({
      ...s,
      isInactive: isInactive(s)
    }))

    // Apply fuzzy search filter
    if (searchQuery.trim()) {
      filtered = filtered
        .map(s => {
          // Match against name, domain, email, and category
          const nameScore = fuzzyMatch(searchQuery, s.name || '')
          const domainScore = fuzzyMatch(searchQuery, s.domain || '')
          const emailScore = fuzzyMatch(searchQuery, s.email || '')
          const categoryScore = fuzzyMatch(searchQuery, s.category || '')
          const bestScore = Math.max(nameScore, domainScore, emailScore, categoryScore)
          return { ...s, _fuzzyScore: bestScore }
        })
        .filter(s => s._fuzzyScore >= 0)
        .sort((a, b) => b._fuzzyScore - a._fuzzyScore)
    }

    // Apply regular sorting (but fuzzy score takes precedence when searching)
    if (!searchQuery.trim()) {
      filtered.sort((a, b) => {
        // Ignored items last
        if (a.ignored && !b.ignored) return 1
        if (!a.ignored && b.ignored) return -1
        // Important items first
        if (a.important && !b.important) return -1
        if (!a.important && b.important) return 1
        if (hideInactive) {
          if (a.isInactive && !b.isInactive) return 1
          if (!a.isInactive && b.isInactive) return -1
        }
        if (spamToEnd) {
          if (a.isSpam && !b.isSpam) return 1
          if (!a.isSpam && b.isSpam) return -1
        }
        return (b.count || 0) - (a.count || 0)
      })
    }

    return filtered
  }, [services, hideInactive, spamToEnd, isInactive, searchQuery])

  const activeServices = services.filter(s => !s.ignored)
  const migratedCount = activeServices.filter(s => s.migrated).length
  const totalCount = activeServices.length
  const ignoredCount = services.filter(s => s.ignored).length

  return {
    services,
    setServices,
    isLoading,
    scanProgress,
    error,
    spamToEnd,
    setSpamToEnd,
    inactiveYears,
    setInactiveYears,
    hideInactive,
    setHideInactive,
    searchQuery,
    setSearchQuery,
    scanGmail,
    toggleMigrated,
    clearServices,
    exportServices,
    getSortedServices,
    migratedCount,
    totalCount,
    ignoredCount,
    saveServices,
    // Selection
    selectedIds,
    handleSelect,
    clearSelection,
    selectAll,
    setMigratedBulk,
    setIgnoredBulk,
    setImportantBulk,
  }
}
