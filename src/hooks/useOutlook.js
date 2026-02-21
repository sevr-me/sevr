import { useState, useEffect, useCallback, useRef } from 'react'
import { PublicClientApplication } from '@azure/msal-browser'
import { MICROSOFT_CLIENT_ID } from '@/lib/constants'

const msalConfig = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
}

const loginRequest = {
  scopes: ['Mail.Read', 'User.Read'],
}

export function useOutlook() {
  const [isOutlookConnected, setIsOutlookConnected] = useState(false)
  const [outlookAccessToken, setOutlookAccessToken] = useState(null)
  const [outlookEmail, setOutlookEmail] = useState(() => localStorage.getItem('sevr-outlook-email'))
  const msalInstanceRef = useRef(null)
  const lastTokenRef = useRef(null)
  const [msalReady, setMsalReady] = useState(false)

  useEffect(() => {
    if (!MICROSOFT_CLIENT_ID) return

    const instance = new PublicClientApplication(msalConfig)
    instance.initialize().then(() => {
      msalInstanceRef.current = instance
      setMsalReady(true)

      // Check if already signed in
      const accounts = instance.getAllAccounts()
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0])
        setIsOutlookConnected(true)
        setOutlookEmail(accounts[0].username)
        localStorage.setItem('sevr-outlook-email', accounts[0].username)
      }
    })
  }, [])

  const getAccessToken = useCallback(async () => {
    const instance = msalInstanceRef.current
    if (!instance) return lastTokenRef.current || null

    const account = instance.getActiveAccount()
    if (!account) return lastTokenRef.current || null

    try {
      const response = await instance.acquireTokenSilent({ ...loginRequest, account })
      lastTokenRef.current = response.accessToken
      return response.accessToken
    } catch {
      try {
        // Silent token acquisition failed, use popup
        const response = await instance.acquireTokenPopup(loginRequest)
        lastTokenRef.current = response.accessToken
        return response.accessToken
      } catch {
        // Fall back to the token from initial login
        return lastTokenRef.current || null
      }
    }
  }, [])

  const handleConnectOutlook = useCallback(async () => {
    const instance = msalInstanceRef.current
    if (!instance) return

    try {
      const response = await instance.loginPopup(loginRequest)
      instance.setActiveAccount(response.account)
      setIsOutlookConnected(true)
      setOutlookAccessToken(response.accessToken)
      lastTokenRef.current = response.accessToken
      setOutlookEmail(response.account.username)
      localStorage.setItem('sevr-outlook-email', response.account.username)
    } catch (err) {
      console.error('Outlook login failed:', err)
    }
  }, [])

  const handleDisconnectOutlook = useCallback(async () => {
    const instance = msalInstanceRef.current
    if (!instance) return

    try {
      await instance.logoutPopup()
    } catch (err) {
      console.error('Outlook logout failed:', err)
    }

    setOutlookAccessToken(null)
    setIsOutlookConnected(false)
    setOutlookEmail(null)
    localStorage.removeItem('sevr-outlook-email')
  }, [])

  return {
    isOutlookConnected,
    outlookAccessToken,
    outlookEmail,
    msalReady,
    handleConnectOutlook,
    handleDisconnectOutlook,
    getAccessToken,
  }
}
