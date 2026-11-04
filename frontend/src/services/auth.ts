const AUTH_EMAIL_DOMAIN = 'users.cardforge.local'

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`
}
