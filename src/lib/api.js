// API helper with automatic token refresh
export async function api(endpoint, options = {}) {
  const accessToken = localStorage.getItem('accessToken')
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  }

  const response = await fetch(endpoint, { ...options, headers })

  // Handle token refresh on 401
  if (response.status === 401 && accessToken) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        localStorage.setItem('accessToken', data.accessToken)
        // Retry original request
        return api(endpoint, options)
      } else {
        // Refresh failed, clear tokens
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.reload()
      }
    }
  }

  return response
}
