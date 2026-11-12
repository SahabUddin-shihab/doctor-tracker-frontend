/** Only same-origin relative paths are allowed as a post-login destination (prevents open redirects). */
export function safeRedirectPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value.startsWith('/login')) return fallback;
  return value;
}
