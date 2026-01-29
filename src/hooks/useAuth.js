import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function useAuth() {
  const [authUser, setAuthUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loginStep, setLoginStep] = useState('email') // 'email' | 'otp'
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Try to restore auth session on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (storedAccessToken && storedRefreshToken) {
      api('/api/user/me')
        .then(async (response) => {
          if (response.ok) {
            const user = await response.json()
            setAuthUser(user)
          } else {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
          }
        })
        .catch(() => {
          // Offline or server error - continue with localStorage
        })
    }
  }, [])

  const handleRequestOtp = useCallback(async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      })

      if (response.ok) {
        setLoginStep('otp')
      } else {
        const data = await response.json()
        setLoginError(data.error || 'Failed to send code')
      }
    } catch (err) {
      setLoginError('Failed to connect to server')
    } finally {
      setLoginLoading(false)
    }
  }, [loginEmail])

  const handleVerifyOtp = useCallback(async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, code: otpCode }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setAuthUser(data.user)
        setShowLoginModal(false)
        setLoginStep('email')
        setLoginEmail('')
        setOtpCode('')
        return true
      } else {
        const data = await response.json()
        setLoginError(data.error || 'Invalid code')
        return false
      }
    } catch (err) {
      setLoginError('Failed to connect to server')
      return false
    } finally {
      setLoginLoading(false)
    }
  }, [loginEmail, otpCode])

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
      } catch (err) {
        // Ignore logout errors
      }
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setAuthUser(null)
  }, [])

  const resetLoginForm = useCallback(() => {
    setLoginStep('email')
    setOtpCode('')
    setLoginError('')
  }, [])

  return {
    authUser,
    setAuthUser,
    showLoginModal,
    setShowLoginModal,
    loginEmail,
    setLoginEmail,
    otpCode,
    setOtpCode,
    loginStep,
    setLoginStep,
    loginLoading,
    loginError,
    setLoginError,
    handleRequestOtp,
    handleVerifyOtp,
    handleLogout,
    resetLoginForm,
  }
}
