import type { Metadata } from "next";
import Providers from "./providers";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import KeyboardShortcut from "@/components/ui/KeyboardShortcut";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/seo/StructuredData";
import { Box, Image, ColorModeScript } from "@chakra-ui/react";

export const metadata: Metadata = {
  title: {
    default: "THC Members Only Club - Premiere Cannabis Social Club",
    template: "%s | THC Members Only Club"
  },
  description: "Join the premiere cannabis social club in Southern California. Discover exclusive events, connect with like-minded members, and experience the finest cannabis culture. Upcoming events, member benefits, and community coordination.",
  keywords: [
    "cannabis social club",
    "THC members only",
    "cannabis events",
    "marijuana social club",
    "cannabis community",
    "Southern California cannabis",
    "cannabis events calendar",
    "marijuana events",
    "cannabis networking",
    "weed social club"
  ],
  authors: [{ name: "THC Members Only Club" }],
  creator: "THC Members Only Club",
  publisher: "THC Members Only Club",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://thcmembersonlyclub.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "THC Members Only Club - Premiere Cannabis Social Club",
    description: "Join the premiere cannabis social club in Southern California. Discover exclusive events, connect with like-minded members, and experience the finest cannabis culture.",
    url: 'https://thcmembersonlyclub.com',
    siteName: 'THC Members Only Club',
    images: [
      {
        url: '/thcmembers-banner.png',
        width: 1200,
        height: 630,
        alt: 'THC Members Only Club - Premiere Cannabis Social Club',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "THC Members Only Club - Premiere Cannabis Social Club",
    description: "Join the premiere cannabis social club in Southern California. Discover exclusive events, connect with like-minded members, and experience the finest cannabis culture.",
    images: ['/thcmembers-banner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorModeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Changa+One:ital@0;1&family=SUSE+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet" />
        <link rel="icon" href="/thc-logo.png" />
        <link rel="apple-touch-icon" href="/thc-logo.png" />
        <meta name="theme-color" content="#2D3748" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <OrganizationStructuredData />
        <WebsiteStructuredData />
      </head>
      <body>
        <Providers>
          <KeyboardShortcut />
          <Navbar />
          <Box width="100%" height={{ base: "220px", md: "260px", lg: "300px" }} overflow="hidden">
            <Image 
              src="/thcmembers-banner.png" 
              alt="THC Members Only Club Banner" 
              width="100%" 
              height="100%" 
              objectFit="cover"
            />
          </Box>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
