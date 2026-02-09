import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ServiceCard({
  service,
  communityGuides,
  isSelected,
  onToggleMigrated,
  onSelect,
  onViewGuide,
  onAddGuide,
}) {
  const guide = communityGuides[service.domain]
  const settingsUrl = guide?.settingsUrl || service.guide

  const handleRowClick = (e) => {
    // Don't select if clicking on buttons or links
    if (e.target.closest('button') || e.target.closest('a')) return
    // Prevent text selection when shift-clicking
    if (e.shiftKey) {
      e.preventDefault()
      window.getSelection()?.removeAllRanges()
    }
    onSelect(service.id, e.shiftKey)
  }

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-md border bg-card transition-colors cursor-pointer',
        service.migrated && 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50',
        service.important && !service.migrated && 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50',
        service.ignored && 'opacity-40',
        service.isSpam && !service.migrated && !service.important && 'border-orange-200 dark:border-orange-900/50',
        service.isInactive && 'border-dashed',
        isSelected && 'ring-1 ring-primary bg-primary/20'
      )}
    >
      <Checkbox
        checked={service.migrated}
        onCheckedChange={() => onToggleMigrated(service.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 flex-shrink-0"
      />

      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
        <span className={cn(
          'font-medium truncate',
          service.migrated && 'line-through text-muted-foreground'
        )}>
          {service.name}
        </span>

        {service.provider && (
          <Badge className={cn(
            'text-xs h-5 px-1.5 border-0',
            service.provider === 'gmail' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            service.provider === 'outlook' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          )}>
            {service.provider === 'gmail' ? 'Gmail' : 'Outlook'}
          </Badge>
        )}

        {service.count > 1 && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {service.count}
          </Badge>
        )}

        <a
          href={service.provider === 'outlook'
            ? `https://outlook.live.com/mail/0/search?query=from%3A${encodeURIComponent(service.domain)}`
            : `https://mail.google.com/mail/u/0/#search/from%3A${encodeURIComponent(service.domain)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {service.domain}
        </a>

        {service.category !== 'Other' && (
          <Badge variant="outline" className="text-xs h-5 px-1.5">
            {service.category}
          </Badge>
        )}

        {service.isSpam && (
          <Badge className="text-xs h-5 px-1.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-0">
            spam
          </Badge>
        )}

        {service.isInactive && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            inactive
          </Badge>
        )}

        {service.important && (
          <Badge className="text-xs h-5 px-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
            important
          </Badge>
        )}

        {service.ignored && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            ignored
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {guide?.noChangePossible ? (
          <Badge
            className="text-xs h-7 px-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0 cursor-pointer"
            onClick={() => onViewGuide(service)}
          >
            Can't change
          </Badge>
        ) : settingsUrl ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
            <a href={settingsUrl} target="_blank" rel="noopener noreferrer">
              Change email ↗
            </a>
          </Button>
        ) : null}

        {guide?.content || guide?.noChangePossible ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onViewGuide(service)}>
            Guide
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => onAddGuide(service)}>
            + Guide
          </Button>
        )}
      </div>
    </div>
  )
}
