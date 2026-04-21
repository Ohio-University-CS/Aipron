import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aipron - AI-Powered Cooking Assistant",
  description: "Generate personalized recipes and get step-by-step cooking guidance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
