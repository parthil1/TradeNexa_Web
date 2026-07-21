import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ActiveRoleProvider } from "@/context/ActiveRoleContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ChatProvider } from "@/context/ChatContext";
import { GeoLocationProvider } from "@/context/GeoLocationContext";
import AppChrome from "@/components/layout/AppChrome";
import { FcmListener } from "@/components/fcm/FcmListener";
import { Toaster } from "react-hot-toast";
import { TOAST_DURATION_MS } from "@/utils/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeNexa - India's Smart B2B Marketplace",
  description:
    "Connect buyers with verified sellers across India. Grow your business through a powerful digital marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-dvh min-w-0 flex-col bg-background text-foreground">
        <AuthProvider>
          <ActiveRoleProvider>
            <WishlistProvider>
              <ChatProvider>
                <GeoLocationProvider>
                  <AppProvider>
                    <AppChrome>{children}</AppChrome>
                    <FcmListener />
                  </AppProvider>
                </GeoLocationProvider>
              </ChatProvider>
            </WishlistProvider>
          </ActiveRoleProvider>
          <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION_MS }} />
        </AuthProvider>
      </body>
    </html>
  );
}
