import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spanish Coach",
  description: "Calm, adaptive Spanish practice for an A1 learner.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#163f3b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

