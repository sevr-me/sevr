import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function PrivacyModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Notice</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold mb-2">Overview</h3>
              <p className="text-muted-foreground">
                Sevr is designed with privacy as a core principle. Your email content
                never leaves your browser, and we collect only the minimum data necessary to
                provide the service.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Gmail Access</h3>
              <p className="text-muted-foreground mb-2">
                We request <strong>read-only</strong> access to your Gmail inbox. This allows us to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Search for emails matching common patterns (welcome emails, password resets, etc.)</li>
                <li>Read email headers (sender address and subject line only)</li>
                <li>Determine when you last received email from each service</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>We do not access:</strong> email bodies, attachments, contacts, or any other Gmail data.
              </p>
              <p className="text-muted-foreground mt-2">
                All Gmail scanning happens directly in your browser. Your Gmail access token is never
                sent to our server.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Local Storage (No Account)</h3>
              <p className="text-muted-foreground mb-2">
                Without an account, we store the following in your browser only:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Your discovered services list (domains, names, migration status)</li>
                <li>Your theme preference (light/dark mode)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                This data never leaves your device unless you create an account.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Server Storage (With Account)</h3>
              <p className="text-muted-foreground mb-2">
                If you create an account, we store on our server:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Your email address (for login)</li>
                <li>Your encrypted service list (we cannot read it without your password)</li>
                <li>Encryption metadata (salt and verifier, for password validation)</li>
                <li>Authentication tokens (hashed, for session management)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>We never store:</strong> your password, Gmail tokens, or unencrypted service data.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-muted-foreground">
                Your service list is encrypted in your browser using AES-256-GCM before being sent
                to our server. The encryption key is derived from your password using PBKDF2 with
                100,000 iterations. We cannot decrypt your data without your password.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Community Guides</h3>
              <p className="text-muted-foreground">
                Guides for changing email on various services are shared publicly and are not
                encrypted. If you contribute a guide, your email address is stored as the author
                (displayed in redacted form to other users).
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Data Retention</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Account data is retained until you delete your account</li>
                <li>OTP codes expire after 10 minutes</li>
                <li>Session tokens expire after 30 days</li>
                <li>Community guide contributions are retained indefinitely</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Data Deletion</h3>
              <p className="text-muted-foreground">
                You can delete your account at any time from your account settings. This permanently
                removes all your data from our servers, including your encrypted service list and
                authentication tokens. Community guide contributions you made will remain but can be
                edited by others.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Third-Party Services</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Google Gmail API:</strong> Used for scanning your inbox (browser-only)</li>
                <li><strong>Google Identity Services:</strong> Used for Gmail authentication</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We do not use analytics, tracking pixels, or advertising services.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Open Source</h3>
              <p className="text-muted-foreground">
                This application is open source. You can audit the code, verify our privacy claims,
                or run your own instance.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-muted-foreground">
                For privacy-related questions or concerns, please open an issue on our GitHub repository.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
