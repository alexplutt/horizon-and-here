/** Accept only same-origin relative paths for post-sign-in redirects. */
export function safeRedirect(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  let path = value;
  if (typeof window !== "undefined" && path.startsWith(window.location.origin)) {
    path = path.slice(window.location.origin.length) || "/";
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.startsWith("/auth")) return fallback;
  return path;
}
