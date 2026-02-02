import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'

const faqItems = [
  {
    question: 'How does Gmail access work?',
    answer: `We use Google's official OAuth2 to request read-only access to your inbox. The access token stays in your browser and is used to directly call Gmail's API. Your emails are never sent to our server — all scanning happens locally in your browser.`,
  },
  {
    question: 'What data is stored on the server?',
    answer: `If you create an account, we store:
• Your email address (for login)
• Your encrypted service list (we cannot read it)
• Encryption salt and verifier (to check your password)

We never store your Gmail access token, your emails, or your encryption password.`,
  },
  {
    question: 'How does end-to-end encryption work?',
    answer: `When you set up encryption:
1. A cryptographic key is derived from your password using PBKDF2 (100,000 iterations)
2. Your service list is encrypted with AES-256-GCM before leaving your browser
3. Only the encrypted blob is sent to our server
4. To decrypt, you need your password — we don't have it`,
  },
  {
    question: 'What if I forget my password?',
    answer: `You have two options:
• Recovery key: During setup, you're shown a recovery key. Save it somewhere safe — it can restore access to your account.
• Reset: If you've lost both your password and recovery key, you can wipe your encrypted data and start over.

We cannot recover your data without your password or recovery key. That's the point of end-to-end encryption.`,
  },
  {
    question: 'What about the community guides?',
    answer: `The guides for changing email on different services are not encrypted — they're shared with all users. Only your personal service list (which domains you've found, migration status) is encrypted.`,
  },
  {
    question: 'Can I use this without an account?',
    answer: `Yes! You can scan your inbox and track migrations using only your browser's local storage. Creating an account adds cross-device sync and encrypted cloud backup.`,
  },
  {
    question: 'Is this open source?',
    answer: `Yes. You can audit the code, run your own instance, or contribute improvements. The encryption happens entirely in your browser using the Web Crypto API.`,
  },
]

export function FaqModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>FAQ</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
