import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
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
  title: "ProjectHub - Professional Project Management",
  description: "Professional project management software for organizing tasks, notes, and workflows with real-time synchronization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 transition-colors duration-500`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col animate-in fade-in duration-700">
            <main className="flex-1 transition-all duration-300 ease-out">
              {children}
            </main>
          </div>
        </AuthProvider>
        
        {/* Global background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/3 to-purple-400/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
      </body>
    </html>
  );
}
