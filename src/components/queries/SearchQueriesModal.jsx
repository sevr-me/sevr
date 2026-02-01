import { useState } from 'react'
import { Plus } from 'lucide-react'
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
}) {
  const [newQuery, setNewQuery] = useState('')
  const [adding, setAdding] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Phrases</DialogTitle>
          <DialogDescription>
            Select which phrases to use when scanning your inbox. {enabledCount} of {queries.length} enabled.
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
              {queries.map((q) => (
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
            </div>
          )}
        </ScrollArea>

        {authUser ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            Sign in to add new search phrases to the shared list.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
