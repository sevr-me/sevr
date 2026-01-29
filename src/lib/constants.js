// Google OAuth configuration
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'

// Patterns to search for account-related emails
export const SEARCH_QUERIES = [
  'subject:"verify your email"',
  'subject:"confirm your email"',
  'subject:"welcome to"',
  'subject:"account created"',
  'subject:"password reset"',
  'subject:"reset your password"',
  'subject:"sign up"',
  'subject:"activate your account"',
  'subject:"confirm your account"',
  'subject:"verify your account"',
]

// Patterns that indicate likely spam/marketing emails
export const SPAM_PATTERNS = [
  /noreply/i,
  /no-reply/i,
  /newsletter/i,
  /marketing/i,
  /promo/i,
  /deals/i,
  /offers/i,
  /unsubscribe/i,
  /bulk/i,
  /campaign/i,
  /mailer/i,
  /notifications?@/i,
  /updates?@/i,
  /news@/i,
  /info@/i,
  /hello@/i,
  /support@/i,
]

// Known service patterns for better detection
export const SERVICE_PATTERNS = {
  'noreply@github.com': { name: 'GitHub', category: 'Development', guide: 'https://github.com/settings/emails' },
  'noreply@google.com': { name: 'Google', category: 'Tech', guide: 'https://myaccount.google.com/email' },
  'no-reply@accounts.google.com': { name: 'Google', category: 'Tech', guide: 'https://myaccount.google.com/email' },
  'noreply@medium.com': { name: 'Medium', category: 'Social', guide: 'https://medium.com/me/settings' },
  'noreply@spotify.com': { name: 'Spotify', category: 'Entertainment', guide: 'https://www.spotify.com/account/profile/' },
  'info@twitter.com': { name: 'Twitter/X', category: 'Social', guide: 'https://twitter.com/settings/email' },
  'noreply@twitter.com': { name: 'Twitter/X', category: 'Social', guide: 'https://twitter.com/settings/email' },
  'no-reply@netflix.com': { name: 'Netflix', category: 'Entertainment', guide: 'https://www.netflix.com/YourAccount' },
  'info@mail.instagram.com': { name: 'Instagram', category: 'Social', guide: 'https://www.instagram.com/accounts/edit/' },
  'noreply@linkedin.com': { name: 'LinkedIn', category: 'Professional', guide: 'https://www.linkedin.com/mypreferences/d/email-address' },
  'no-reply@dropbox.com': { name: 'Dropbox', category: 'Productivity', guide: 'https://www.dropbox.com/account/profile' },
  'noreply@slack.com': { name: 'Slack', category: 'Productivity', guide: 'Account settings in each workspace' },
  'noreply@amazon.com': { name: 'Amazon', category: 'Shopping', guide: 'https://www.amazon.com/gp/css/account/info/view.html' },
  'account-update@amazon.com': { name: 'Amazon', category: 'Shopping', guide: 'https://www.amazon.com/gp/css/account/info/view.html' },
}
