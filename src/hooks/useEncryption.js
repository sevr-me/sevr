import { useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  deriveKey,
  generateSalt,
  encrypt,
  decrypt,
  createVerifier,
  verifyPassword,
  saltToBase64,
  base64ToSalt,
  generateRecoveryKey,
  wrapKeyForRecovery,
  verifyRecoveryKey,
} from '@/crypto'

export function useEncryption() {
  const [encryptionKey, setEncryptionKey] = useState(null)
  const [encryptionStatus, setEncryptionStatus] = useState(null)
  const [encryptionSalt, setEncryptionSalt] = useState(null)
  const [encryptionVerifier, setEncryptionVerifier] = useState(null)
  const [recoveryVerifier, setRecoveryVerifier] = useState(null)
  const [showEncryptionModal, setShowEncryptionModal] = useState(false)
  const [encryptionPassword, setEncryptionPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('')
  const [encryptionError, setEncryptionError] = useState('')
  const [encryptionLoading, setEncryptionLoading] = useState(false)

  const checkEncryptionStatus = useCallback(async () => {
    try {
      const response = await api('/api/encrypted/status')
      if (response.ok) {
        const data = await response.json()
        if (data.isSetUp) {
          setEncryptionStatus('needs_unlock')
          setEncryptionSalt(data.salt)
          setEncryptionVerifier(data.verifier)
          setRecoveryVerifier(data.recoveryVerifier)
        } else {
          setEncryptionStatus('needs_setup')
        }
        setShowEncryptionModal(true)
      }
    } catch (err) {
      console.error('Failed to check encryption status:', err)
    }
  }, [])

  const loadEncryptedServices = useCallback(async (key) => {
    try {
      const response = await api('/api/encrypted/data')
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.iv) {
          const decrypted = await decrypt(key, { data: data.data, iv: data.iv })
          return decrypted
        }
      }
    } catch (err) {
      console.error('Failed to load encrypted services:', err)
    }
    return null
  }, [])

  const saveEncryptedServices = useCallback(async (key, servicesToSave) => {
    try {
      const encrypted = await encrypt(key, servicesToSave)
      await api('/api/encrypted/data', {
        method: 'PUT',
        body: JSON.stringify({ data: encrypted.data, iv: encrypted.iv }),
      })
    } catch (err) {
      console.error('Failed to save encrypted services:', err)
    }
  }, [])

  const handleSetupEncryption = useCallback(async (e, services, setServices) => {
    e.preventDefault()
    setEncryptionError('')

    if (encryptionPassword.length < 8) {
      setEncryptionError('Password must be at least 8 characters')
      return false
    }

    if (encryptionPassword !== confirmPassword) {
      setEncryptionError('Passwords do not match')
      return false
    }

    setEncryptionLoading(true)
    try {
      const salt = generateSalt()
      const key = await deriveKey(encryptionPassword, salt)
      const verifier = await createVerifier(key)
      const saltB64 = saltToBase64(salt)

      const newRecoveryKey = generateRecoveryKey()
      const recoveryVerifierValue = await wrapKeyForRecovery(key, newRecoveryKey)

      const response = await api('/api/encrypted/setup', {
        method: 'POST',
        body: JSON.stringify({
          salt: saltB64,
          verifier,
          recoveryVerifier: recoveryVerifierValue,
          allowOverwrite: true
        }),
      })

      if (response.ok) {
        setEncryptionKey(key)
        setEncryptionSalt(saltB64)
        setEncryptionVerifier(verifier)
        setRecoveryVerifier(recoveryVerifierValue)
        setRecoveryKey(newRecoveryKey)
        setEncryptionPassword('')
        setConfirmPassword('')

        if (services && services.length > 0) {
          await saveEncryptedServices(key, services)
        }

        setEncryptionStatus('show_recovery_key')
        return true
      } else {
        const data = await response.json()
        setEncryptionError(data.error || 'Failed to set up encryption')
        return false
      }
    } catch (err) {
      setEncryptionError('Failed to set up encryption')
      return false
    } finally {
      setEncryptionLoading(false)
    }
  }, [encryptionPassword, confirmPassword, saveEncryptedServices])

  const handleUnlockEncryption = useCallback(async (e, setServices) => {
    e.preventDefault()
    setEncryptionError('')
    setEncryptionLoading(true)

    try {
      const salt = base64ToSalt(encryptionSalt)
      const key = await deriveKey(encryptionPassword, salt)
      const isValid = await verifyPassword(key, encryptionVerifier)

      if (!isValid) {
        setEncryptionError('Incorrect password')
        setEncryptionLoading(false)
        return false
      }

      setEncryptionKey(key)
      setEncryptionStatus('unlocked')
      setShowEncryptionModal(false)
      setEncryptionPassword('')

      const services = await loadEncryptedServices(key)
      if (services && setServices) {
        setServices(services)
      }

      return true
    } catch (err) {
      setEncryptionError('Failed to unlock. Incorrect password?')
      return false
    } finally {
      setEncryptionLoading(false)
    }
  }, [encryptionSalt, encryptionPassword, encryptionVerifier, loadEncryptedServices])

  const handleRecoveryUnlock = useCallback(async (e) => {
    e.preventDefault()
    setEncryptionError('')
    setEncryptionLoading(true)

    try {
      const isValid = await verifyRecoveryKey(recoveryKeyInput.trim(), recoveryVerifier)

      if (!isValid) {
        setEncryptionError('Invalid recovery key')
        setEncryptionLoading(false)
        return false
      }

      setEncryptionStatus('needs_setup')
      setRecoveryKeyInput('')
      setEncryptionError('')
      alert('Recovery key verified. Please set up a new encryption password.')
      return true
    } catch (err) {
      setEncryptionError('Failed to verify recovery key')
      return false
    } finally {
      setEncryptionLoading(false)
    }
  }, [recoveryKeyInput, recoveryVerifier])

  const handleResetEncryption = useCallback(async (setServices) => {
    setEncryptionLoading(true)
    try {
      const response = await api('/api/encrypted/reset', {
        method: 'POST',
      })

      if (response.ok) {
        if (setServices) setServices([])
        setEncryptionKey(null)
        setEncryptionSalt(null)
        setEncryptionVerifier(null)
        setRecoveryVerifier(null)
        setEncryptionStatus('needs_setup')
        setEncryptionError('')
        return true
      } else {
        setEncryptionError('Failed to reset encryption')
        return false
      }
    } catch (err) {
      setEncryptionError('Failed to reset encryption')
      return false
    } finally {
      setEncryptionLoading(false)
    }
  }, [])

  const handleDismissRecoveryKey = useCallback(() => {
    setRecoveryKey('')
    setEncryptionStatus('unlocked')
    setShowEncryptionModal(false)
  }, [])

  const clearEncryptionState = useCallback(() => {
    setEncryptionKey(null)
    setEncryptionStatus(null)
    setEncryptionSalt(null)
    setEncryptionVerifier(null)
  }, [])

  return {
    encryptionKey,
    encryptionStatus,
    setEncryptionStatus,
    encryptionSalt,
    encryptionVerifier,
    recoveryVerifier,
    showEncryptionModal,
    setShowEncryptionModal,
    encryptionPassword,
    setEncryptionPassword,
    confirmPassword,
    setConfirmPassword,
    recoveryKey,
    recoveryKeyInput,
    setRecoveryKeyInput,
    encryptionError,
    setEncryptionError,
    encryptionLoading,
    checkEncryptionStatus,
    loadEncryptedServices,
    saveEncryptedServices,
    handleSetupEncryption,
    handleUnlockEncryption,
    handleRecoveryUnlock,
    handleResetEncryption,
    handleDismissRecoveryKey,
    clearEncryptionState,
  }
}
