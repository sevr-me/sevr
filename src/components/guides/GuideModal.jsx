import { marked } from 'marked'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { redactEmail } from '@/lib/gmail'

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

export function GuideModal({
  editingGuide,
  isEditingGuide,
  guideSaving,
  guideError,
  authUser,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onUpdateGuide,
}) {
  if (!editingGuide) return null

  return (
    <Dialog open={!!editingGuide} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Guide: {editingGuide.name}</DialogTitle>
          <DialogDescription>
            How to change your email address for {editingGuide.domain}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {isEditingGuide ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settingsUrl">Settings URL</Label>
                <Input
                  id="settingsUrl"
                  type="url"
                  value={editingGuide.settingsUrl}
                  onChange={(e) => onUpdateGuide({ settingsUrl: e.target.value })}
                  placeholder="https://example.com/account/settings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Instructions (Markdown)</Label>
                <Textarea
                  id="content"
                  value={editingGuide.content}
                  onChange={(e) => onUpdateGuide({ content: e.target.value })}
                  placeholder={`Write your guide in Markdown...

Example:
## Steps
1. Go to **Settings** → **Account**
2. Click on *Email address*
3. Enter your new email
4. Verify via confirmation email

## Notes
- You may need to re-verify your account`}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {editingGuide.settingsUrl && (
                <Button asChild className="w-full">
                  <a
                    href={editingGuide.settingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go to {editingGuide.name} settings ↗
                  </a>
                </Button>
              )}

              {editingGuide.content ? (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Community Guide</p>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked(editingGuide.content) }}
                  />
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    No community guide yet. {authUser ? 'Click Edit to add one.' : 'Sign in to add one.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {editingGuide.updatedBy && !isEditingGuide && (
          <p className="text-xs text-muted-foreground">
            Last edited by {redactEmail(editingGuide.updatedBy)} on{' '}
            {new Date(editingGuide.updatedAt).toLocaleDateString()}
          </p>
        )}

        {guideError && (
          <Alert variant="destructive">
            <AlertDescription>{guideError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          {isEditingGuide ? (
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={guideSaving || !authUser}>
                {guideSaving ? 'Saving...' : 'Save Guide'}
              </Button>
            </>
          ) : (
            <>
              {authUser && (
                <Button variant="outline" onClick={onEdit}>
                  Edit
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
