import { useState, useEffect, useCallback } from 'react'
import { CLIENT_ID, SCOPES } from '@/lib/constants'

export function useGmail() {
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)
  const [accessToken, setAccessToken] = useState(null)

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
        callback: (response) => {
          if (response.access_token) {
            setAccessToken(response.access_token)
            setIsGmailConnected(true)
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

  const handleDisconnectGmail = useCallback(() => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken)
    }
    setAccessToken(null)
    setIsGmailConnected(false)
  }, [accessToken])

  return {
    isGmailConnected,
    tokenClient,
    accessToken,
    handleConnectGmail,
    handleDisconnectGmail,
  }
}
