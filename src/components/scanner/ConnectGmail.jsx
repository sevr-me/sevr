import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ConnectGmail({ authUser, tokenClient, onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>What is SEVR?</CardTitle>
          <CardDescription>
            SEVR helps you discover all the online accounts and services linked to your Gmail address.
            Planning to switch email providers? SEVR scans your inbox for welcome emails, password resets,
            and account confirmations to build a complete list of services you've signed up for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">How it works</h4>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Connect your Gmail with read-only access</li>
              <li>SEVR scans email headers (sender & subject) for account-related emails</li>
              <li>Get a list of all services linked to your email</li>
              <li>Use community-created guides to change your email on each service</li>
              <li>Track your progress as you update each account</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Privacy first</h4>
            <p className="text-sm text-muted-foreground">
              All scanning happens <strong>entirely in your browser</strong>. Your emails are never sent to any server.
              We only read email headers — not email content or attachments.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Save your progress</h4>
            <p className="text-sm text-muted-foreground">
              Optionally create an account to save your service list across devices. Your data is encrypted
              in your browser before being stored — only you can decrypt it with your password.
              Come back anytime to continue working through your list.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={onConnect} disabled={!tokenClient}>
        Connect Gmail (Read-Only)
      </Button>

      {!tokenClient && (
        <p className="text-sm text-muted-foreground">Loading Google authentication...</p>
      )}

      <p className="text-sm text-muted-foreground">
        By connecting, you agree to our{' '}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
      </p>
    </div>
  )
}
