import { Button } from '@/components/ui/button'

export function Header({ authUser, onLogin, onLogout, darkMode, onToggleTheme }) {
  return (
    <header className="border-b bg-background">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold">Sevr</h1>
          <p className="text-sm text-muted-foreground">
            Discover which services are tied to your email address
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="h-8 w-8 px-0"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </Button>
          {authUser ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{authUser.email}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onLogin}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
