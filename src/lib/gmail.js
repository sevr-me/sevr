import { SPAM_PATTERNS, SERVICE_PATTERNS } from './constants'

// Check if an email/domain is likely spam
export function isLikelySpam(email, domain) {
  // Check email patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(email)) return true
  }
  // Generic marketing domains
  const spamDomains = ['mailchimp.com', 'sendgrid.net', 'constantcontact.com', 'klaviyo.com', 'mailgun.org']
  return spamDomains.some(d => domain.includes(d))
}

// Extract service info from email message
export function extractServiceInfo(message) {
  const headers = message.payload?.headers || []
  const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''

  // Extract email address from "Name <email>" format
  const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader]
  const email = emailMatch[1]?.toLowerCase() || fromHeader.toLowerCase()

  // Extract domain
  const domainMatch = email.match(/@([^@]+)$/)
  const domain = domainMatch ? domainMatch[1] : email

  // Check known patterns first
  for (const [pattern, info] of Object.entries(SERVICE_PATTERNS)) {
    if (email.includes(pattern.toLowerCase())) {
      return { ...info, email, domain, rawFrom: fromHeader }
    }
  }

  // Try to extract service name from domain or sender name
  const senderNameMatch = fromHeader.match(/^([^<]+)</)
  const senderName = senderNameMatch ? senderNameMatch[1].trim() : null

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
    rawFrom: fromHeader,
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
