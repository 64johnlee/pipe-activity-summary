import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity Summary | screenpipe",
  description: "Daily & weekly AI-powered productivity insights from your screen history",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
