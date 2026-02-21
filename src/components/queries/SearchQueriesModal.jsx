import { useState } from 'react'
import { Plus, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SearchQueriesModal({
  open,
  onOpenChange,
  queries,
  loading,
  error,
  onAdd,
  onToggle,
  onSelectAll,
  onSelectNone,
  isEnabled,
  enabledCount,
  authUser,
  scanSettings,
  onUpdateScanSettings,
}) {
  const [newQuery, setNewQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [showDetection, setShowDetection] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newQuery.trim()) return

    setAdding(true)
    const success = await onAdd(newQuery.trim())
    if (success) {
      setNewQuery('')
    }
    setAdding(false)
  }

  const approvedQueries = queries.filter(q => q.approved)
  const pendingQueries = queries.filter(q => !q.approved)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Phrases</DialogTitle>
          <DialogDescription>
            Select which phrases to use when scanning your inbox. {enabledCount} of {approvedQueries.length} enabled.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 text-sm">
          <button className="text-primary hover:underline" onClick={onSelectAll}>
            Select all
          </button>
          <span className="text-muted-foreground">·</span>
          <button className="text-primary hover:underline" onClick={onSelectNone}>
            Select none
          </button>
        </div>

        <ScrollArea className="h-[40vh] pr-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {approvedQueries.map((q) => (
                <label
                  key={q.id}
                  className="flex items-center gap-3 p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
                >
                  <Checkbox
                    checked={isEnabled(q.id)}
                    onCheckedChange={() => onToggle(q.id)}
                  />
                  <code className="text-sm flex-1 break-all">{q.query}</code>
                </label>
              ))}
              {pendingQueries.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground pt-2 pb-1">Pending approval (only visible to you)</div>
                  {pendingQueries.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted opacity-70"
                    >
                      <Checkbox
                        checked={isEnabled(q.id)}
                        onCheckedChange={() => onToggle(q.id)}
                      />
                      <code className="text-sm flex-1 break-all">{q.query}</code>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </label>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {authUser ? (
          <div className="space-y-2">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                type="text"
                placeholder='e.g. subject:"account confirmation"'
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={adding || !newQuery.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              New queries require admin approval before others can see them.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sign in to add new search phrases.
          </p>
        )}

        {scanSettings && onUpdateScanSettings && (
          <div className="border-t pt-3">
            <button
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-full"
              onClick={() => setShowDetection(!showDetection)}
            >
              {showDetection ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Detection Settings
            </button>
            {showDetection && (
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="categoryFilter"
                    checked={scanSettings.categoryFilter}
                    onCheckedChange={(checked) => onUpdateScanSettings({ ...scanSettings, categoryFilter: !!checked })}
                  />
                  <div>
                    <Label htmlFor="categoryFilter" className="text-sm cursor-pointer">Category awareness</Label>
                    <p className="text-xs text-muted-foreground">Use Gmail/Outlook email categories as a signal</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="senderAnalysis"
                    checked={scanSettings.senderAnalysis}
                    onCheckedChange={(checked) => onUpdateScanSettings({ ...scanSettings, senderAnalysis: !!checked })}
                  />
                  <div>
                    <Label htmlFor="senderAnalysis" className="text-sm cursor-pointer">Sender classification</Label>
                    <p className="text-xs text-muted-foreground">Classify sender addresses (transactional vs marketing)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="temporalDetection"
                    checked={scanSettings.temporalDetection}
                    onCheckedChange={(checked) => onUpdateScanSettings({ ...scanSettings, temporalDetection: !!checked })}
                  />
                  <div>
                    <Label htmlFor="temporalDetection" className="text-sm cursor-pointer">First-email detection</Label>
                    <p className="text-xs text-muted-foreground">Boost confidence when matched email is the first from a domain</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
