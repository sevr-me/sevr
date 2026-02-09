const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

export const gmailAdapter = {
  async searchMessages(accessToken, query, maxResults = 100) {
    const response = await fetch(
      `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`)
    }

    const data = await response.json()
    return { messages: data.messages || [] }
  },

  async fetchMessageMetadata(accessToken, messageId) {
    const response = await fetch(
      `${GMAIL_API}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const message = await response.json()

    const headers = message.payload?.headers || []
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''

    // Parse "Name <email>" format
    const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader]
    const email = emailMatch[1]?.toLowerCase() || fromHeader.toLowerCase()
    const nameMatch = fromHeader.match(/^([^<]+)</)
    const name = nameMatch ? nameMatch[1].trim().replace(/"/g, '') : null

    return {
      id: message.id,
      from: { name, email },
      subject: subjectHeader,
      date: parseInt(message.internalDate, 10),
      rawFrom: fromHeader,
    }
  },

  async fetchRecentFromDomain(accessToken, domain) {
    const response = await fetch(
      `${GMAIL_API}/messages?q=${encodeURIComponent(`from:${domain}`)}&maxResults=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (!data.messages?.length) return null

    const msgResponse = await fetch(
      `${GMAIL_API}/messages/${data.messages[0].id}?format=minimal`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!msgResponse.ok) return null

    const msgData = await msgResponse.json()
    return {
      id: msgData.id,
      date: parseInt(msgData.internalDate, 10),
    }
  },
}
