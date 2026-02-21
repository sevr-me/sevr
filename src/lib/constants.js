// Google OAuth configuration
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'

// Microsoft OAuth configuration
export const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID

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

// Sender prefix taxonomy for confidence scoring
export const SENDER_TAXONOMY = {
  transactional: [
    'noreply', 'no-reply', 'no_reply', 'donotreply', 'do-not-reply',
    'account', 'accounts', 'verify', 'verification', 'confirm',
    'security', 'auth', 'register', 'registration', 'signup',
    'welcome', 'support', 'help', 'team', 'admin',
  ],
  marketing: [
    'newsletter', 'marketing', 'promo', 'promotions', 'deals',
    'offers', 'news', 'digest', 'campaign', 'mailer',
    'bulk', 'blast', 'announce', 'updates', 'notifications',
    'hello', 'info', 'contact',
  ],
}

// Strong signup indicators (verification, confirmation, activation)
export const STRONG_SIGNUP_PATTERNS = [
  /verify your (email|account)/i,
  /confirm your (email|account|registration)/i,
  /activate your account/i,
  /email verification/i,
  /please verify/i,
  /complete your registration/i,
  /one more step/i,
  /successfully registered/i,
  /thanks for (signing up|registering)/i,
  /confirm your registration/i,
  /set up your account/i,
  /finish setting up/i,
]

// Known ESP / marketing infrastructure domains
export const MARKETING_DOMAINS = [
  'mailchimp.com', 'sendgrid.net', 'constantcontact.com',
  'klaviyo.com', 'mailgun.org', 'mailgun.com', 'sendinblue.com',
  'brevo.com', 'hubspot.com', 'mailjet.com', 'postmarkapp.com',
  'mandrillapp.com', 'sparkpostmail.com', 'campaignmonitor.com',
  'convertkit.com', 'drip.com', 'activecampaign.com',
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
