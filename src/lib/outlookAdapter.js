const GRAPH_API = 'https://graph.microsoft.com/v1.0/me'

async function graphFetch(url, accessToken, retries = 5) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 429 && retries > 0) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '3', 10)
    await new Promise(r => setTimeout(r, retryAfter * 1000))
    return graphFetch(url, accessToken, retries - 1)
  }

  return response
}

export const outlookAdapter = {
  async searchMessages(accessToken, query, maxResults = 100) {
    // Convert Gmail-style queries (subject:"phrase") to KQL for Graph API.
    // KQL inside $search="..." uses single quotes for phrases.
    const kqlQuery = query.replace(/"/g, "'")
    const response = await graphFetch(
      `${GRAPH_API}/messages?$search="${encodeURIComponent(kqlQuery)}"&$top=${maxResults}&$select=id`,
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
      `${GRAPH_API}/messages/${messageId}?$select=id,from,subject,receivedDateTime,inferenceClassification`,
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
      classification: msg.inferenceClassification || 'focused',
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
