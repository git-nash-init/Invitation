import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Tiro_Devanagari_Hindi } from "next/font/google";
import { BRAND, SITE_URL } from "@/lib/brand";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--nf-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const deva = Tiro_Devanagari_Hindi({
  variable: "--nf-deva",
  subsets: ["devanagari", "latin"],
  weight: "400",
});

const ui = DM_Sans({
  variable: "--nf-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const title = `${BRAND.name}: ${BRAND.tagline.toLowerCase()}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    title,
    description: BRAND.description,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: { card: "summary_large_image", title, description: BRAND.description },
};

export const viewport: Viewport = {
  themeColor: "#fff8ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${deva.variable} ${ui.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
