import { Button } from '@/components/ui/button'

export function Footer({ showEncrypted, onShowFaq, onShowPrivacy }) {
  return (
    <footer className="border-t bg-muted/40 py-4">
      <div className="max-w-3xl mx-auto px-4 text-center text-sm text-muted-foreground w-full">
        <p>
          Your email data never leaves your browser.
          {showEncrypted && ' Service list encrypted end-to-end.'}
          {' '}
          <Button variant="link" className="px-1 h-auto" onClick={onShowPrivacy}>
            Privacy
          </Button>
          {' '}
          <Button variant="link" className="px-1 h-auto" onClick={onShowFaq}>
            FAQ
          </Button>
          {' '}
          <a
            href="https://github.com/sevr-me/sevr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            View source
          </a>
          {' '}
          <a
            href="https://buymeacoffee.com/sevr.me"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            ☕ Support
          </a>
        </p>
      </div>
    </footer>
  )
}
