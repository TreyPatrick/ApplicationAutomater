import type { Metadata } from "next";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_APP_NAME || "OfferDesk";

export const metadata: Metadata = {
  title: name,
  description: "Find open roles, tailor your resume, and draft applications — powered by Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ ["--font-sans" as string]: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
