import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ServiceDetailsModal({ service, onClose }) {
  if (!service) return null

  const messages = [...(service.messages || [])].sort((a, b) => b.date - a.date)

  return (
    <Dialog open={!!service} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Matched emails: {service.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matched emails recorded.</p>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_2fr_auto] gap-x-4 gap-y-0 text-xs text-muted-foreground border-b pb-1.5 mb-1">
                <span>Sender</span>
                <span>Subject</span>
                <span>Date</span>
              </div>
              {messages.map((msg, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-x-4 items-center text-sm py-1.5 border-b last:border-0">
                  <span className="truncate text-muted-foreground">{msg.from || service.domain}</span>
                  <span className="truncate">{msg.subject || '(no subject)'}</span>
                  {msg.date ? (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(msg.date).toLocaleDateString()}</span>
                  ) : <span />}
                </div>
              ))}
              {service.count > messages.length && (
                <p className="text-xs text-muted-foreground pt-2">
                  Showing {messages.length} of {service.count} matched emails.
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
