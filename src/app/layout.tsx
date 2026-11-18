import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--nf-display",
  subsets: ["latin"],
  axes: ["opsz"],
});

const ui = Instrument_Sans({
  variable: "--nf-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({
  variable: "--nf-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SutraLuxe: interactive wedding invitations",
    template: "%s | SutraLuxe",
  },
  description:
    "Pick an interactive wedding invitation, make it yours, publish it and share one link, or a personal link for every guest.",
  openGraph: {
    title: "SutraLuxe: interactive wedding invitations",
    description:
      "Pick an interactive wedding invitation, make it yours, publish it and share one link, or a personal link for every guest.",
    type: "website",
    siteName: "SutraLuxe",
  },
};

export const viewport: Viewport = {
  themeColor: "#161513",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${ui.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
