import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Raleway } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

import { ConvexClientProvider } from "@/lib/convex";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export const metadata: Metadata = {
  title: "Phantom Pen - AI Voice Notes",
  description: "Capture your thoughts by voice with Phantom Pen.",
  openGraph: {
    images:
      "https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/Screenshot_2025-08-19_at_3.41.57%E2%80%AFAM.png",
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/Screenshot_2025-08-19_at_3.41.57%E2%80%AFAM.png",
    ],
  },
  manifest: "/site.webmanifest",
  icons: {
    apple: "/icons/512.png",
  },
  appleWebApp: {
    capable: true,
    title: "Phantom Pen",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use client-side navigation for login/signup
  // This must be a Client Component to use useRouter, so we can use a workaround:
  // Place a ClientHeader component below
  return (
    <html lang="en">
      <body className={`${raleway.variable} antialiased`}>
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            <div className="min-h-screen bg-white flex flex-col">
              {children}
              <Toaster position="top-center" />
            </div>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
