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
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isGmailConnected ? (
        <>
          <Button onClick={onScan} disabled={isLoading}>
            {isLoading ? 'Scanning...' : hasServices ? 'Rescan Inbox' : 'Scan Inbox'}
          </Button>
          <Button variant="outline" onClick={onDisconnect}>
            Disconnect Gmail
          </Button>
        </>
      ) : (
        <Button onClick={onConnect} disabled={!tokenClient}>
          Connect Gmail to Rescan
        </Button>
      )}

      {hasServices && (
        <>
          <Button variant="outline" onClick={onExport}>
            Export JSON
          </Button>
          <Button variant="destructive" onClick={onClear}>
            Clear
          </Button>
        </>
      )}
    </div>
  )
}
