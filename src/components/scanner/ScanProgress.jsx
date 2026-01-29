import { Progress } from '@/components/ui/progress'

export function ScanProgress({ scanProgress }) {
  const progressPercent = scanProgress.total > 0
    ? (scanProgress.current / scanProgress.total) * 100
    : 0

  return (
    <div className="space-y-2">
      <Progress value={progressPercent} className="h-2" />
      <p className="text-sm text-muted-foreground text-center">
        {scanProgress.status}
      </p>
    </div>
  )
}
