import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-background text-foreground">
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>
            <Footer />
          </AppProvider>
          <Toaster
            position="top-left"
            toastOptions={{ duration: 3000 }}
            containerStyle={{ top: 72, left: 16 }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
