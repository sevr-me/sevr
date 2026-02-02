import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function FilterControls({
  spamToEnd,
  setSpamToEnd,
  hideInactive,
  setHideInactive,
  inactiveYears,
  setInactiveYears,
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <Checkbox
          id="spamToEnd"
          checked={spamToEnd}
          onCheckedChange={setSpamToEnd}
        />
        <Label htmlFor="spamToEnd" className="text-muted-foreground cursor-pointer">
          Move likely spam to end
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="hideInactive"
          checked={hideInactive}
          onCheckedChange={setHideInactive}
        />
        <Label htmlFor="hideInactive" className="text-muted-foreground cursor-pointer">
          Move inactive to end
        </Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={inactiveYears}
          onChange={(e) => setInactiveYears(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 h-7"
        />
        <span className="text-muted-foreground">years</span>
      </div>
    </div>
  )
}
