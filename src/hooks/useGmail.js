import { useState, useEffect, useCallback, useRef } from 'react'
import { CLIENT_ID, SCOPES } from '@/lib/constants'

export function useGmail() {
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [gmailEmail, setGmailEmail] = useState(() => localStorage.getItem('sevr-gmail-email'))
  const [gmailError, setGmailError] = useState(null)
  const accessTokenRef = useRef(null)

  // Initialize Google Identity Services
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        error_callback: (err) => {
          console.error('Gmail OAuth error:', err)
          setGmailError(err.type || 'OAuth failed')
        },
        callback: async (response) => {
          if (response.error) {
            console.error('Gmail OAuth error response:', response)
            setGmailError(`${response.error}: ${response.error_description || 'Unknown error'}`)
            return
          }
          if (response.access_token) {
            setGmailError(null)
            accessTokenRef.current = response.access_token
            setAccessToken(response.access_token)
            setIsGmailConnected(true)
            // Fetch Gmail user's email address
            try {
              const profileRes = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/profile',
                { headers: { Authorization: `Bearer ${response.access_token}` } }
              )
              if (profileRes.ok) {
                const profile = await profileRes.json()
                setGmailEmail(profile.emailAddress)
                localStorage.setItem('sevr-gmail-email', profile.emailAddress)
              }
            } catch (err) {
              console.error('Failed to fetch Gmail profile:', err)
            }
          } else {
            console.error('Gmail OAuth: no access token in response', response)
            setGmailError('No access token received')
          }
        },
      })
      setTokenClient(client)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleConnectGmail = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken()
    }
  }, [tokenClient])

  const getAccessToken = useCallback(() => {
    return accessTokenRef.current
  }, [])

  const handleDisconnectGmail = useCallback(() => {
    if (accessTokenRef.current) {
      window.google.accounts.oauth2.revoke(accessTokenRef.current)
    }
    accessTokenRef.current = null
    setAccessToken(null)
    setIsGmailConnected(false)
    setGmailEmail(null)
    localStorage.removeItem('sevr-gmail-email')
  }, [])

  return {
    isGmailConnected,
    tokenClient,
    accessToken,
    gmailEmail,
    gmailError,
    handleConnectGmail,
    handleDisconnectGmail,
    getAccessToken,
  }
}
