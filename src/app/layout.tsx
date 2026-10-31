import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brightloop Software | Unified Subscription & Recurring Billing Platform",
  description:
    "Automated subscription lifecycle, recurring billing, tax & discount calculation, payment reconciliation, and revenue intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
