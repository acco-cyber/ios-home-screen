import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iOS Home — Web Edition",
  description:
    "A polished, fluent iOS-style home screen in the browser: swipeable pages, live widgets, wiggle mode, Notification & Control Center, and six working apps.",
  keywords: ["iOS", "home screen", "widgets", "Next.js", "React", "Web Audio"],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23111'/%3E%3Ccircle cx='32' cy='32' r='14' fill='%23e4e4e7'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-zinc-950">{children}</body>
    </html>
  );
}
