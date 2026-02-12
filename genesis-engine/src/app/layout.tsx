import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GenesisProvider } from "@/lib/store/GenesisContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genesis Engine // Neural Operating System",
  description: "The Music Theory of Reality. AI-Powered Physics & Knowledge Synthesis.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Genesis Engine",
    description: "Compose your own reality using the world's first Physical Music Theory simulation.",
    images: ["/globe.svg"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GenesisProvider>
          {children}
        </GenesisProvider>
      </body>
    </html>
  );
}
