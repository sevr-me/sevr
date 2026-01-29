import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'

export function EncryptionModal({
  open,
  encryptionStatus,
  encryptionPassword,
  setEncryptionPassword,
  confirmPassword,
  setConfirmPassword,
  recoveryKey,
  recoveryKeyInput,
  setRecoveryKeyInput,
  encryptionError,
  encryptionLoading,
  onSetup,
  onUnlock,
  onRecoveryUnlock,
  onReset,
  onDismissRecoveryKey,
  onUseRecoveryKey,
  onConfirmReset,
  onBackToPassword,
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Setup encryption */}
        {encryptionStatus === 'needs_setup' && (
          <>
            <DialogHeader>
              <DialogTitle>Set Up Encryption</DialogTitle>
              <DialogDescription>
                Create a password to encrypt your service list. This password never leaves your device.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Encryption password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {encryptionError && (
                <Alert variant="destructive">
                  <AlertDescription>{encryptionError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={encryptionLoading}>
                {encryptionLoading ? 'Setting up...' : 'Set Up Encryption'}
              </Button>
            </form>
          </>
        )}

        {/* Unlock with password */}
        {encryptionStatus === 'needs_unlock' && (
          <>
            <DialogHeader>
              <DialogTitle>Unlock Your Data</DialogTitle>
              <DialogDescription>
                Enter your encryption password to access your saved services.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unlockPassword">Encryption password</Label>
                <Input
                  id="unlockPassword"
                  type="password"
                  placeholder="Enter your password"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {encryptionError && (
                <Alert variant="destructive">
                  <AlertDescription>{encryptionError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={encryptionLoading}>
                {encryptionLoading ? 'Unlocking...' : 'Unlock'}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 text-sm">
              <Button variant="link" className="h-auto p-0" onClick={onUseRecoveryKey}>
                Use recovery key
              </Button>
              <span className="text-muted-foreground">·</span>
              <Button variant="link" className="h-auto p-0" onClick={onConfirmReset}>
                Forgot password
              </Button>
            </div>
          </>
        )}

        {/* Show recovery key after setup */}
        {encryptionStatus === 'show_recovery_key' && (
          <>
            <DialogHeader>
              <DialogTitle>Save Your Recovery Key</DialogTitle>
              <DialogDescription>
                Write this down and keep it safe. You'll need it if you forget your password.
              </DialogDescription>
            </DialogHeader>

            <Card className="p-4 bg-muted">
              <code className="text-sm font-mono break-all">{recoveryKey}</code>
            </Card>

            <Alert>
              <AlertDescription>
                This key will only be shown once. Store it securely!
              </AlertDescription>
            </Alert>

            <Button onClick={onDismissRecoveryKey} className="w-full">
              I've saved my recovery key
            </Button>
          </>
        )}

        {/* Use recovery key */}
        {encryptionStatus === 'use_recovery_key' && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Recovery Key</DialogTitle>
              <DialogDescription>
                Enter the recovery key you saved when setting up encryption.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onRecoveryUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recoveryKey">Recovery key</Label>
                <Input
                  id="recoveryKey"
                  type="text"
                  placeholder="Paste your recovery key"
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(e.target.value)}
                  required
                  autoFocus
                  className="font-mono"
                />
              </div>

              {encryptionError && (
                <Alert variant="destructive">
                  <AlertDescription>{encryptionError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={encryptionLoading}>
                {encryptionLoading ? 'Verifying...' : 'Recover Account'}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" className="h-auto p-0" onClick={onBackToPassword}>
                Back to password
              </Button>
            </div>
          </>
        )}

        {/* Confirm reset */}
        {encryptionStatus === 'confirm_reset' && (
          <>
            <DialogHeader>
              <DialogTitle>Reset Encryption?</DialogTitle>
              <DialogDescription>
                This will permanently delete all your encrypted data. You'll start fresh with a new password.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertDescription>
                This action cannot be undone. All your saved services will be lost.
              </AlertDescription>
            </Alert>

            {encryptionError && (
              <Alert variant="destructive">
                <AlertDescription>{encryptionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={onReset}
                disabled={encryptionLoading}
              >
                {encryptionLoading ? 'Resetting...' : 'Delete Everything & Start Over'}
              </Button>
              <Button variant="outline" className="w-full" onClick={onBackToPassword}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
