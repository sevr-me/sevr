import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function start() {
  // If we're inside an MSAL auth popup (hash contains the auth response),
  // broadcast the response to the parent window and close. Don't render the app.
  if (window.location.hash.includes('code=') && window.location.hash.includes('state=')) {
    const { broadcastResponseToMainFrame } = await import('@azure/msal-browser/redirect-bridge')
    await broadcastResponseToMainFrame()
    return
  }

  const { default: App } = await import('./App.jsx')

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
