import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScannerControls({
  isGmailConnected,
  isOutlookConnected,
  isLoading,
  hasServices,
  tokenClient,
  msalReady,
  onScan,
  onConnectGmail,
  onDisconnectGmail,
  onConnectOutlook,
  onDisconnectOutlook,
  onExport,
  onClear,
  onShowQueries,
}) {
  const isAnyConnected = isGmailConnected || isOutlookConnected

  return (
    <div className="flex flex-col gap-2">
      {isAnyConnected && (
        <Button onClick={onScan} disabled={isLoading} className="w-full">
          {isLoading ? 'Scanning...' : hasServices ? 'Rescan Inbox' : 'Scan Inbox'}
        </Button>
      )}

      {/* Gmail connection */}
      {isGmailConnected ? (
        <Button variant="outline" onClick={onDisconnectGmail} className="w-full">
          Disconnect Gmail
        </Button>
      ) : (
        <Button variant="outline" onClick={onConnectGmail} disabled={!tokenClient} className="w-full">
          Connect Gmail
        </Button>
      )}

      {/* Outlook connection */}
      {isOutlookConnected ? (
        <Button variant="outline" onClick={onDisconnectOutlook} className="w-full">
          Disconnect Outlook
        </Button>
      ) : (
        <Button variant="outline" onClick={onConnectOutlook} disabled={!msalReady} className="w-full">
          Connect Outlook
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
