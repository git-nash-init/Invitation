import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isDev = process.env.NODE_ENV !== "production";

// Next.js needs inline scripts for hydration; 'unsafe-eval' is dev-only (React refresh).
const appCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: ${supabaseUrl}`,
  `media-src 'self' blob: ${supabaseUrl}`,
  `connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace("https://", "wss://")}`,
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Invitation templates are static pages that run in same-origin iframes.
// They may load Google Fonts and the host's uploaded media, but no foreign scripts.
const templateCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: ${supabaseUrl}`,
  `media-src 'self' blob: ${supabaseUrl}`,
  `connect-src 'self' ${supabaseUrl}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Templates use relative asset paths (../symbols/..., media/...), so their
  // URLs under /t/ must keep the trailing slash instead of being redirected away from it.
  skipTrailingSlashRedirect: true,
  // The template files are not in /public. They ship with the /t route only.
  outputFileTracingIncludes: {
    "/t/[...path]": ["./private-templates/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/((?!t/).*)",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: appCsp },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/t/:path*",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: templateCsp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
