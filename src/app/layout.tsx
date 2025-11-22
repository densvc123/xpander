import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XPANDER - AI-First Project Operating System",
  description: "Plan smarter. Build faster. AI-powered project management for modern teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
