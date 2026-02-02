import { useState, useEffect } from 'react'

// Hooks
import { useAuth } from '@/hooks/useAuth'
import { useEncryption } from '@/hooks/useEncryption'
import { useGmail } from '@/hooks/useGmail'
import { useServices } from '@/hooks/useServices'
import { useGuides } from '@/hooks/useGuides'
import { useSearchQueries } from '@/hooks/useSearchQueries'
import { useAdmin } from '@/hooks/useAdmin'

// Components
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LoginModal } from '@/components/auth/LoginModal'
import { EncryptionModal } from '@/components/encryption/EncryptionModal'
import { FaqModal } from '@/components/faq/FaqModal'
import { PrivacyModal } from '@/components/privacy/PrivacyModal'
import { GuideModal } from '@/components/guides/GuideModal'
import { SearchQueriesModal } from '@/components/queries/SearchQueriesModal'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { ConnectGmail } from '@/components/scanner/ConnectGmail'
import { ScannerControls } from '@/components/scanner/ScannerControls'
import { ScanProgress } from '@/components/scanner/ScanProgress'
import { ServicesList } from '@/components/services/ServicesList'
import { Alert, AlertDescription } from '@/components/ui/alert'

function App() {
  const [showFaq, setShowFaq] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showQueries, setShowQueries] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true // Default to dark
  })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Track anonymous page view (no cookies, privacy-friendly)
  useEffect(() => {
    // Only track once per session using sessionStorage
    if (sessionStorage.getItem('tracked')) return
    sessionStorage.setItem('tracked', '1')
    fetch('/api/track', { method: 'POST' }).catch(() => {})
  }, [])

  // Auth hook
  const {
    authUser,
    showLoginModal,
    setShowLoginModal,
    loginEmail,
    setLoginEmail,
    otpCode,
    setOtpCode,
    loginStep,
    loginLoading,
    loginError,
    handleRequestOtp,
    handleVerifyOtp,
    handleLogout,
    resetLoginForm,
  } = useAuth()

  // Encryption hook
  const {
    encryptionKey,
    encryptionStatus,
    setEncryptionStatus,
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
    saveEncryptedServices,
    handleSetupEncryption,
    handleUnlockEncryption,
    handleRecoveryUnlock,
    handleResetEncryption,
    handleDismissRecoveryKey,
    clearEncryptionState,
  } = useEncryption()

  // Gmail hook
  const {
    isGmailConnected,
    tokenClient,
    accessToken,
    gmailEmail,
    handleConnectGmail,
    handleDisconnectGmail,
  } = useGmail()

  // Search queries hook
  const {
    queries: searchQueriesList,
    queryStrings: searchQueries,
    enabledQueries,
    loading: queriesLoading,
    error: queriesError,
    setError: setQueriesError,
    addQuery,
    toggleQuery,
    selectAll: selectAllQueries,
    selectNone: selectNoneQueries,
    isEnabled: isQueryEnabled,
    enabledCount: enabledQueryCount,
    trackHits: trackQueryHits,
  } = useSearchQueries()

  // Services hook
  const {
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
    scanGmail,
    toggleMigrated,
    clearServices,
    exportServices,
    getSortedServices,
    migratedCount,
    totalCount,
    // Selection
    selectedIds,
    handleSelect,
    clearSelection,
    selectAll,
    setMigratedBulk,
    setIgnoredBulk,
    setImportantBulk,
  } = useServices(encryptionKey, encryptionStatus, saveEncryptedServices, enabledQueries, trackQueryHits)

  // Guides hook
  const {
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
  } = useGuides(authUser)

  // Admin hook
  const {
    stats: adminStats,
    users: adminUsers,
    guides: adminGuides,
    queries: adminQueries,
    blacklist: adminBlacklist,
    activities: adminActivities,
    usersOverTime: adminUsersOverTime,
    usersByCountry: adminUsersByCountry,
    onlineUsers: adminOnlineUsers,
    loading: adminLoading,
    refresh: adminRefresh,
    connectActivityFeed,
    deleteGuide: adminDeleteGuide,
    updateGuide: adminUpdateGuide,
    deleteUser: adminDeleteUser,
    addToBlacklist: adminAddToBlacklist,
    removeFromBlacklist: adminRemoveFromBlacklist,
    deleteQuery: adminDeleteQuery,
    approveQuery: adminApproveQuery,
  } = useAdmin(authUser)

  // Send heartbeat to track online status
  useEffect(() => {
    if (!authUser) return

    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          console.error('Heartbeat failed')
        }
      } catch (err) {
        console.error('Heartbeat error:', err)
      }
    }

    // Send immediately and then every 30 seconds
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30000)

    return () => clearInterval(interval)
  }, [authUser])

  // Check encryption status after successful login
  const handleVerifyOtpWithEncryption = async (e) => {
    const success = await handleVerifyOtp(e)
    if (success) {
      checkEncryptionStatus()
    }
  }

  // Extended logout to clear encryption state
  const handleLogoutWithCleanup = async () => {
    await handleLogout()
    clearEncryptionState()
  }

  const sortedServices = getSortedServices()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        authUser={authUser}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogoutWithCleanup}
        onAdmin={() => setShowAdmin(true)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      <main className="flex-1 w-full">
        {!isGmailConnected && services.length === 0 ? (
          <div className="max-w-3xl mx-auto px-4 py-6">
            <ConnectGmail
              authUser={authUser}
              tokenClient={tokenClient}
              onConnect={handleConnectGmail}
            />
          </div>
        ) : (
          <div className="relative max-w-3xl mx-auto px-4 py-6">
            {/* Left Sidebar - positioned to the left of centered content */}
            <aside className="absolute right-full mr-4 w-48 space-y-6 hidden lg:block">
              <ScannerControls
                isGmailConnected={isGmailConnected}
                isLoading={isLoading}
                hasServices={services.length > 0}
                tokenClient={tokenClient}
                onScan={() => scanGmail(accessToken)}
                onConnect={handleConnectGmail}
                onDisconnect={handleDisconnectGmail}
                onExport={exportServices}
                onClear={clearServices}
                onShowQueries={() => setShowQueries(true)}
              />

              {isLoading && <ScanProgress scanProgress={scanProgress} />}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}

              <a
                href="https://buymeacoffee.com/sevr.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <span>☕</span>
                <span>Buy me a coffee</span>
              </a>
            </aside>

            {/* Mobile controls */}
            <div className="lg:hidden mb-4 space-y-4">
              <ScannerControls
                isGmailConnected={isGmailConnected}
                isLoading={isLoading}
                hasServices={services.length > 0}
                tokenClient={tokenClient}
                onScan={() => scanGmail(accessToken)}
                onConnect={handleConnectGmail}
                onDisconnect={handleDisconnectGmail}
                onExport={exportServices}
                onClear={clearServices}
                onShowQueries={() => setShowQueries(true)}
              />
              {isLoading && <ScanProgress scanProgress={scanProgress} />}
            </div>

            {services.length > 0 && (
              <ServicesList
                services={sortedServices}
                communityGuides={communityGuides}
                gmailEmail={gmailEmail}
                migratedCount={migratedCount}
                totalCount={totalCount}
                spamToEnd={spamToEnd}
                setSpamToEnd={setSpamToEnd}
                hideInactive={hideInactive}
                setHideInactive={setHideInactive}
                inactiveYears={inactiveYears}
                setInactiveYears={setInactiveYears}
                groupByDomain={groupByDomain}
                setGroupByDomain={setGroupByDomain}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onToggleMigrated={toggleMigrated}
                onViewGuide={(service) => openGuide(service, false)}
                onAddGuide={(service) => openGuide(service, true)}
                // Selection
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onClearSelection={clearSelection}
                onSelectAll={selectAll}
                onSetMigratedBulk={setMigratedBulk}
                onSetIgnoredBulk={setIgnoredBulk}
                onSetImportantBulk={setImportantBulk}
              />
            )}

            {!isLoading && services.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Click "Scan Inbox" to discover services linked to your email.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a minute for large inboxes.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer
        showEncrypted={authUser && encryptionStatus === 'unlocked'}
        onShowFaq={() => setShowFaq(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
      />

      {/* Fixed progress indicator */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-full px-3 py-1.5 shadow-lg text-sm font-medium">
          {migratedCount} / {totalCount}
        </div>
      )}

      {/* Modals */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        loginStep={loginStep}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        loginLoading={loginLoading}
        loginError={loginError}
        onRequestOtp={handleRequestOtp}
        onVerifyOtp={handleVerifyOtpWithEncryption}
        onBack={resetLoginForm}
      />

      <EncryptionModal
        open={showEncryptionModal}
        encryptionStatus={encryptionStatus}
        encryptionPassword={encryptionPassword}
        setEncryptionPassword={setEncryptionPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        recoveryKey={recoveryKey}
        recoveryKeyInput={recoveryKeyInput}
        setRecoveryKeyInput={setRecoveryKeyInput}
        encryptionError={encryptionError}
        encryptionLoading={encryptionLoading}
        onSetup={(e) => handleSetupEncryption(e, services, setServices)}
        onUnlock={(e) => handleUnlockEncryption(e, setServices)}
        onRecoveryUnlock={handleRecoveryUnlock}
        onReset={() => handleResetEncryption(setServices)}
        onDismissRecoveryKey={handleDismissRecoveryKey}
        onUseRecoveryKey={() => setEncryptionStatus('use_recovery_key')}
        onConfirmReset={() => setEncryptionStatus('confirm_reset')}
        onBackToPassword={() => {
          setEncryptionStatus('needs_unlock')
          setRecoveryKeyInput('')
          setEncryptionError('')
        }}
      />

      <FaqModal open={showFaq} onOpenChange={setShowFaq} />
      <PrivacyModal open={showPrivacy} onOpenChange={setShowPrivacy} />

      <SearchQueriesModal
        open={showQueries}
        onOpenChange={(open) => {
          setShowQueries(open)
          if (!open) setQueriesError(null)
        }}
        queries={searchQueriesList}
        loading={queriesLoading}
        error={queriesError}
        onAdd={addQuery}
        onToggle={toggleQuery}
        onSelectAll={selectAllQueries}
        onSelectNone={selectNoneQueries}
        isEnabled={isQueryEnabled}
        enabledCount={enabledQueryCount}
        authUser={authUser}
      />

      <GuideModal
        editingGuide={editingGuide}
        isEditingGuide={isEditingGuide}
        guideSaving={guideSaving}
        guideError={guideError}
        authUser={authUser}
        onClose={closeGuide}
        onEdit={() => setIsEditingGuide(true)}
        onSave={handleSaveGuide}
        onCancel={cancelEditing}
        onUpdateGuide={updateEditingGuide}
      />

      <AdminDashboard
        open={showAdmin}
        onOpenChange={setShowAdmin}
        stats={adminStats}
        users={adminUsers}
        guides={adminGuides}
        queries={adminQueries}
        blacklist={adminBlacklist}
        activities={adminActivities}
        usersOverTime={adminUsersOverTime}
        usersByCountry={adminUsersByCountry}
        onlineUsers={adminOnlineUsers}
        loading={adminLoading}
        onRefresh={adminRefresh}
        onConnect={connectActivityFeed}
        onDeleteGuide={adminDeleteGuide}
        onUpdateGuide={adminUpdateGuide}
        onDeleteUser={adminDeleteUser}
        onAddToBlacklist={adminAddToBlacklist}
        onRemoveFromBlacklist={adminRemoveFromBlacklist}
        onDeleteQuery={adminDeleteQuery}
        onApproveQuery={adminApproveQuery}
        currentUserEmail={authUser?.email}
      />
    </div>
  )
}

export default App
