const GRAPH_API = 'https://graph.microsoft.com/v1.0/me'

async function graphFetch(url, accessToken, retries = 2) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 429 && retries > 0) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10)
    await new Promise(r => setTimeout(r, retryAfter * 1000))
    return graphFetch(url, accessToken, retries - 1)
  }

  return response
}

export const outlookAdapter = {
  async searchMessages(accessToken, query, maxResults = 100) {
    const response = await graphFetch(
      `${GRAPH_API}/messages?$search="${encodeURIComponent(query)}"&$top=${maxResults}&$select=id`,
      accessToken
    )

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status}`)
    }

    const data = await response.json()
    return { messages: (data.value || []).map(m => ({ id: m.id })) }
  },

  async fetchMessageMetadata(accessToken, messageId) {
    const response = await graphFetch(
      `${GRAPH_API}/messages/${messageId}?$select=id,from,subject,receivedDateTime`,
      accessToken
    )
    const msg = await response.json()

    const emailAddress = msg.from?.emailAddress || {}
    const email = (emailAddress.address || '').toLowerCase()
    const name = emailAddress.name || null
    const rawFrom = name ? `${name} <${email}>` : email

    return {
      id: msg.id,
      from: { name, email },
      subject: msg.subject || '',
      date: new Date(msg.receivedDateTime).getTime(),
      rawFrom,
    }
  },

  async fetchRecentFromDomain(accessToken, domain) {
    const response = await graphFetch(
      `${GRAPH_API}/messages?$search="from:${encodeURIComponent(domain)}"&$top=5&$select=id,receivedDateTime`,
      accessToken
    )

    if (!response.ok) return null

    const data = await response.json()
    const messages = data.value || []
    if (messages.length === 0) return null

    // Graph $search returns relevance-ordered, so pick the latest by date
    let latest = messages[0]
    for (const msg of messages) {
      if (new Date(msg.receivedDateTime) > new Date(latest.receivedDateTime)) {
        latest = msg
      }
    }

    return {
      id: latest.id,
      date: new Date(latest.receivedDateTime).getTime(),
    }
  },
}
