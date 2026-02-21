import { SENDER_TAXONOMY, STRONG_SIGNUP_PATTERNS, MARKETING_DOMAINS, SERVICE_PATTERNS } from './constants'

// Classify a sender email prefix as transactional, marketing, or neutral
export function classifySender(email) {
  if (!email) return 'neutral'
  const prefix = email.split('@')[0].toLowerCase()

  for (const txPrefix of SENDER_TAXONOMY.transactional) {
    if (prefix === txPrefix || prefix.startsWith(txPrefix + '+') || prefix.startsWith(txPrefix + '.')) {
      return 'transactional'
    }
  }

  for (const mktPrefix of SENDER_TAXONOMY.marketing) {
    if (prefix === mktPrefix || prefix.startsWith(mktPrefix + '+') || prefix.startsWith(mktPrefix + '.')) {
      return 'marketing'
    }
  }

  return 'neutral'
}

// Check if a query string matches a strong signup pattern
export function isStrongSignupQuery(query) {
  // Extract the subject text from the query (e.g. 'subject:"verify your email"' -> 'verify your email')
  const match = query.match(/subject:"([^"]+)"/)
  const text = match ? match[1] : query
  return STRONG_SIGNUP_PATTERNS.some(pattern => pattern.test(text))
}

// Check if a domain belongs to a known marketing ESP
export function isMarketingDomain(domain) {
  if (!domain) return false
  return MARKETING_DOMAINS.some(d => domain.endsWith(d))
}

// Compute confidence score from multiple signals
// signals: { strongSubject, weakSubject, transactionalSender, marketingSender,
//            updatesCategory, promotionsCategory, espDomain, firstEmailMatch }
export function computeConfidence(signals) {
  let score = 0

  if (signals.strongSubject) score += 35
  else if (signals.weakSubject) score += 20

  if (signals.transactionalSender) score += 15
  if (signals.updatesCategory) score += 15
  if (signals.promotionsCategory) score -= 20
  if (signals.marketingSender) score -= 25
  if (signals.espDomain) score -= 40
  if (signals.firstEmailMatch) score += 15

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score))

  let level
  if (score >= 50) level = 'high'
  else if (score >= 25) level = 'medium'
  else level = 'low'

  return { score, level }
}

// Extract service info from normalized message { from: { name, email }, subject, rawFrom }
export function extractServiceInfo(normalizedMsg) {
  const email = normalizedMsg.from.email || ''
  const senderName = normalizedMsg.from.name || null
  const rawFrom = normalizedMsg.rawFrom || ''

  // Extract domain
  const domainMatch = email.match(/@([^@]+)$/)
  const domain = domainMatch ? domainMatch[1] : email

  // Check known patterns first
  for (const [pattern, info] of Object.entries(SERVICE_PATTERNS)) {
    if (email.includes(pattern.toLowerCase())) {
      return { ...info, email, domain, rawFrom }
    }
  }

  // Clean up domain to get service name
  let serviceName = domain
    .replace(/^(mail\.|noreply\.|no-reply\.|info\.|support\.|account\.|accounts\.)/, '')
    .replace(/\.(com|org|net|io|co|app|me).*$/, '')
    .split('.')[0]

  // Capitalize first letter
  serviceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1)

  // Use sender name if it looks better
  if (senderName && !senderName.toLowerCase().includes('noreply') && senderName.length < 30) {
    serviceName = senderName.replace(/"/g, '').trim()
  }

  return {
    name: serviceName,
    category: 'Other',
    email,
    domain,
    rawFrom,
    guide: null
  }
}

// Helper to redact email: "john.doe@example.com" -> "j***e@example.com"
export function redactEmail(email) {
  if (!email) return null
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}
