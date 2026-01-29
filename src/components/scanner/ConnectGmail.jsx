import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ConnectGmail({ authUser, tokenClient, onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Privacy First</CardTitle>
          <CardDescription>
            This tool runs <strong>entirely in your browser</strong>. Your emails are never sent to any server.
            We only scan email headers (sender, subject) to identify services — not email content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authUser ? (
            <p className="text-sm text-muted-foreground">
              You're signed in — your discovered services will be saved to your account for easy access across devices.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sign in to save your progress across sessions, or continue without an account using localStorage.
            </p>
          )}
        </CardContent>
      </Card>

      <Button size="lg" onClick={onConnect} disabled={!tokenClient}>
        Connect Gmail (Read-Only)
      </Button>

      {!tokenClient && (
        <p className="text-sm text-muted-foreground">Loading Google authentication...</p>
      )}
    </div>
  )
}
