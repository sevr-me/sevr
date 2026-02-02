import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScannerControls({
  isGmailConnected,
  isLoading,
  hasServices,
  tokenClient,
  onScan,
  onConnect,
  onDisconnect,
  onExport,
  onClear,
  onShowQueries,
}) {
  return (
    <div className="flex flex-col gap-2">
      {isGmailConnected ? (
        <>
          <Button onClick={onScan} disabled={isLoading} className="w-full">
            {isLoading ? 'Scanning...' : hasServices ? 'Rescan Inbox' : 'Scan Inbox'}
          </Button>
          <Button variant="outline" onClick={onDisconnect} className="w-full">
            Disconnect Gmail
          </Button>
        </>
      ) : (
        <Button onClick={onConnect} disabled={!tokenClient} className="w-full">
          Connect Gmail to Rescan
        </Button>
      )}

      <Button variant="outline" onClick={onShowQueries} title="Configure search phrases" className="w-full">
        <Settings2 className="h-4 w-4 mr-2" />
        Search Queries
      </Button>

      {hasServices && (
        <>
          <Button variant="outline" onClick={onExport} className="w-full">
            Export JSON
          </Button>
          <Button variant="destructive" onClick={onClear} className="w-full">
            Clear All
          </Button>
        </>
      )}
    </div>
  )
}
