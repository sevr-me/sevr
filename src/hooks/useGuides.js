import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function useGuides(authUser) {
  const [communityGuides, setCommunityGuides] = useState({})
  const [editingGuide, setEditingGuide] = useState(null)
  const [isEditingGuide, setIsEditingGuide] = useState(false)
  const [guideSaving, setGuideSaving] = useState(false)
  const [guideError, setGuideError] = useState('')

  // Fetch community guides on mount
  useEffect(() => {
    fetch('/api/guides')
      .then(res => res.ok ? res.json() : {})
      .then(guides => setCommunityGuides(guides))
      .catch(() => {})
  }, [])

  const handleSaveGuide = useCallback(async () => {
    if (!editingGuide || !authUser) return false

    setGuideSaving(true)
    try {
      const response = await api(`/api/guides/${encodeURIComponent(editingGuide.domain)}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: editingGuide.content,
          settingsUrl: editingGuide.settingsUrl
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCommunityGuides(prev => ({
          ...prev,
          [editingGuide.domain]: {
            content: data.content,
            settingsUrl: data.settingsUrl,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          }
        }))
        setIsEditingGuide(false)
        setGuideError('')
        return true
      } else {
        const data = await response.json()
        setGuideError(data.error || 'Failed to save guide')
        return false
      }
    } catch (err) {
      setGuideError('Failed to save guide')
      return false
    } finally {
      setGuideSaving(false)
    }
  }, [editingGuide, authUser])

  const openGuide = useCallback((service, forEditing = false) => {
    const guide = communityGuides[service.domain]
    setEditingGuide({
      domain: service.domain,
      name: service.name,
      content: guide?.content || '',
      settingsUrl: guide?.settingsUrl || service.guide || '',
      defaultUrl: service.guide,
      updatedAt: guide?.updatedAt,
      updatedBy: guide?.updatedBy
    })
    setIsEditingGuide(forEditing)
    setGuideError('')
  }, [communityGuides])

  const closeGuide = useCallback(() => {
    setEditingGuide(null)
    setIsEditingGuide(false)
    setGuideError('')
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditingGuide(false)
    setGuideError('')
    if (editingGuide) {
      const guide = communityGuides[editingGuide.domain]
      setEditingGuide(prev => ({
        ...prev,
        content: guide?.content || '',
        settingsUrl: guide?.settingsUrl || prev?.defaultUrl || ''
      }))
    }
  }, [editingGuide, communityGuides])

  const updateEditingGuide = useCallback((updates) => {
    setEditingGuide(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  return {
    communityGuides,
    editingGuide,
    isEditingGuide,
    setIsEditingGuide,
    guideSaving,
    guideError,
    handleSaveGuide,
    openGuide,
    closeGuide,
    cancelEditing,
    updateEditingGuide,
  }
}
