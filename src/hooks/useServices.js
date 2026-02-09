import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { extractServiceInfo } from '@/lib/gmail'
import { getAdapter } from '@/lib/mailProvider'

// Extract main domain from full domain (e.g., mail.google.com -> google.com)
function getMainDomain(domain) {
  if (!domain) return ''
  const parts = domain.toLowerCase().split('.')
  if (parts.length <= 2) return domain.toLowerCase()

  // Handle common second-level TLDs (co.uk, com.au, etc.)
  const secondLevelTLDs = ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac']
  const lastPart = parts[parts.length - 1]
  const secondLastPart = parts[parts.length - 2]

  if (secondLevelTLDs.includes(secondLastPart) && lastPart.length === 2) {
    // e.g., amazon.co.uk -> take last 3 parts
    return parts.slice(-3).join('.')
  }

  // Default: take last 2 parts
  return parts.slice(-2).join('.')
}

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

export function useServices(encryptionKey, encryptionStatus, saveEncryptedServices, searchQueries = [], trackHits = null) {
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
  const [groupByDomain, setGroupByDomain] = useState(false)
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

  const scanInbox = useCallback(async (providers) => {
    if (!providers || providers.length === 0) return
    if (searchQueries.length === 0) {
      setError('No search queries configured')
      return
    }

    setIsLoading(true)
    setError(null)

    const totalQueries = searchQueries.length * providers.length
    setScanProgress({ current: 0, total: totalQueries, status: 'Starting scan...' })

    const foundServices = new Map()
    const queryHits = new Map()
    let queryIndex = 0

    try {
      for (const provider of providers) {
        const adapter = getAdapter(provider.type)
        if (!adapter) {
          console.error(`Unknown provider type: ${provider.type}`)
          continue
        }

        for (let i = 0; i < searchQueries.length; i++) {
          const queryObj = searchQueries[i]
          const query = queryObj.query || queryObj
          const queryId = queryObj.id

          queryIndex++
          setScanProgress({
            current: queryIndex,
            total: totalQueries,
            status: `Searching (${provider.type}): ${query.replace('subject:', '')}`
          })

          const searchData = await adapter.searchMessages(provider.accessToken, query, 100)
          const messages = searchData.messages || []

          if (queryId && messages.length > 0) {
            queryHits.set(queryId, (queryHits.get(queryId) || 0) + messages.length)
          }

          for (let j = 0; j < messages.length; j += 10) {
            const batch = messages.slice(j, j + 10)

            const details = await Promise.all(
              batch.map(msg => adapter.fetchMessageMetadata(provider.accessToken, msg.id))
            )

            for (const normalizedMsg of details) {
              const serviceInfo = extractServiceInfo(normalizedMsg)
              const key = serviceInfo.domain

              const messageDate = normalizedMsg.date
              if (!foundServices.has(key)) {
                foundServices.set(key, {
                  ...serviceInfo,
                  id: key,
                  migrated: false,
                  firstSeen: messageDate,
                  lastSeen: messageDate,
                  count: 1,
                  isSpam: false,
                  provider: provider.type,
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

        // Second pass: get most recent email from each domain for this provider
        const domains = Array.from(foundServices.keys())
        setScanProgress({
          current: 0,
          total: domains.length,
          status: `Checking last activity (${provider.type})...`
        })

        for (let i = 0; i < domains.length; i += 5) {
          const batch = domains.slice(i, i + 5)

          await Promise.all(batch.map(async (domain) => {
            try {
              const recent = await adapter.fetchRecentFromDomain(provider.accessToken, domain)
              if (recent) {
                const service = foundServices.get(domain)
                if (recent.date > service.lastSeen) {
                  service.lastSeen = recent.date
                }
              }
            } catch (err) {
              console.error(`Failed to get recent activity for ${domain}:`, err)
            }
          }))

          setScanProgress({
            current: Math.min(i + 5, domains.length),
            total: domains.length,
            status: `Checking last activity (${provider.type})...`
          })

          await new Promise(r => setTimeout(r, 100))
        }
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

      // Track query hits
      if (trackHits && queryHits.size > 0) {
        const hits = Array.from(queryHits.entries()).map(([id, count]) => ({ id, count }))
        trackHits(hits)
      }

      setScanProgress({ current: totalQueries, total: totalQueries, status: 'Scan complete!' })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [services, saveServices, searchQueries, trackHits])

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
      isInactive: isInactive(s),
      mainDomain: getMainDomain(s.domain)
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
        // Group by main domain if enabled
        if (groupByDomain) {
          const domainCompare = a.mainDomain.localeCompare(b.mainDomain)
          if (domainCompare !== 0) return domainCompare
        }
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
  }, [services, hideInactive, spamToEnd, groupByDomain, isInactive, searchQuery])

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
    groupByDomain,
    setGroupByDomain,
    searchQuery,
    setSearchQuery,
    scanInbox,
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
