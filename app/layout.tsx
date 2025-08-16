import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";

import { ConvexClientProvider } from "@/lib/convex";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phantom Pen - Capture Your Thoughts By Voice",
  description: "Convert your thoughts into text by voice with Phantom Pen.",
  openGraph: {
    images:
      "https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/WhatsApp_Image_2025-08-15_at_01.46.49.jpeg",
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
        <ClerkProvider>
          <ConvexClientProvider>
            <div className="min-h-screen bg-white flex flex-col">
              <Header />
              {children}
              <Toaster position="top-center" />
              <Footer />
            </div>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
