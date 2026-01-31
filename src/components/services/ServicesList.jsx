import { Search, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ServiceCard } from './ServiceCard'
import { FilterControls } from './FilterControls'

export function ServicesList({
  services,
  communityGuides,
  gmailEmail,
  migratedCount,
  totalCount,
  spamToEnd,
  setSpamToEnd,
  hideInactive,
  setHideInactive,
  inactiveYears,
  setInactiveYears,
  searchQuery,
  setSearchQuery,
  onToggleMigrated,
  onViewGuide,
  onAddGuide,
  // Selection props
  selectedIds,
  onSelect,
  onClearSelection,
  onSelectAll,
  onSetMigratedBulk,
  onSetIgnoredBulk,
  onSetImportantBulk,
}) {
  const progressPercent = totalCount > 0 ? (migratedCount / totalCount) * 100 : 0
  const selectedCount = selectedIds.size

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Discovered Services ({totalCount})
          </h2>
          {gmailEmail && (
            <p className="text-sm text-muted-foreground">from {gmailEmail}</p>
          )}
        </div>

        <FilterControls
          spamToEnd={spamToEnd}
          setSpamToEnd={setSpamToEnd}
          hideInactive={hideInactive}
          setHideInactive={setHideInactive}
          inactiveYears={inactiveYears}
          setInactiveYears={setInactiveYears}
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {migratedCount} / {totalCount} migrated
        </span>
        <Progress value={progressPercent} className="flex-1 h-2" />
      </div>

      {/* Selection toolbar - sticky when scrolling */}
      {selectedCount > 0 && (() => {
        const selectedServices = services.filter(s => selectedIds.has(s.id))
        const allDone = selectedServices.every(s => s.migrated)
        const allImportant = selectedServices.every(s => s.important)
        const allIgnored = selectedServices.every(s => s.ignored)

        return (
          <div className="sticky top-0 z-10 flex items-center gap-2 p-2 bg-muted rounded-md shadow-sm">
            <span className="text-sm font-medium">{selectedCount} selected</span>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => onSetMigratedBulk(!allDone)}>
              {allDone ? 'Not done' : 'Done'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSetImportantBulk(!allImportant)}>
              {allImportant ? 'Not important' : 'Important'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSetIgnoredBulk(!allIgnored)}>
              {allIgnored ? 'Unignore' : 'Ignore'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Cancel
            </Button>
          </div>
        )
      })()}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Click to select, Shift+click for range. {selectedCount === 0 && (
            <button className="underline" onClick={() => onSelectAll(services)}>Select all</button>
          )}
        </p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 w-48"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            communityGuides={communityGuides}
            isSelected={selectedIds.has(service.id)}
            onToggleMigrated={onToggleMigrated}
            onSelect={(id, shiftKey) => onSelect(id, services, shiftKey)}
            onViewGuide={onViewGuide}
            onAddGuide={onAddGuide}
          />
        ))}
      </div>
    </div>
  )
}
