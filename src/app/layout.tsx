import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { PostHogProvider } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
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
  title: "MediFlow — Gestion de clinique au Cameroun",
  description:
    "Plateforme gratuite de gestion de clinique avec prise de RDV en ligne. Agenda intelligent, fiches patients, géolocalisation. Yaoundé, Douala, Garoua.",
  keywords: ["clinique", "cameroun", "rendez-vous", "yaoundé", "douala", "médecin", "santé"],
  authors: [{ name: "TGM Automation", url: "https://github.com/guilloulearnlife" }],
  openGraph: {
    title: "MediFlow — Trouvez une clinique près de chez vous",
    description:
      "Recherchez et prenez RDV avec des cliniques au Cameroun en quelques clics",
    url: "https://mediflow-two.vercel.app",
    siteName: "MediFlow",
    locale: "fr_CM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediFlow — Gestion de clinique Cameroun",
    description: "Trouvez et prenez RDV avec des cliniques près de chez vous",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Suspense>
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </Suspense>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0D1B2E",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
            success: {
              iconTheme: {
                primary: "#00E5A0",
                secondary: "#060D1A",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
