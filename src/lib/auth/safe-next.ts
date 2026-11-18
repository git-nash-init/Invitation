/**
 * Only same-site relative paths are allowed as a post-login destination,
 * which closes the open-redirect hole.
 */
export function safeNext(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value;
}
