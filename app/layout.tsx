import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"], // dropped 500 and 800 — not used in the design
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Azalea by Zehra — Draped in Elegance",
    template: "%s | Azalea by Zehra",
  },
  description:
    "Premium Indian women's ethnic wear — Kurtis, Salwar Sets, Co-ord Sets & more. Crafted with love, draped in elegance.",
  keywords: [
    "Indian kurtis", "ethnic wear", "women's fashion", "salwar kameez",
    "Indian fashion", "anarkali", "co-ord sets", "kurta sets", "buy kurtis online",
    "ethnic wear India", "Azalea by Zehra",
  ],
  metadataBase: new URL("https://azaleabyzehra.com"),
  alternates: { canonical: "https://azaleabyzehra.com" },
  openGraph: {
    title: "Azalea by Zehra — Draped in Elegance",
    description:
      "Premium Indian women's ethnic wear — Kurtis, Salwar Sets, Co-ord Sets & more. Crafted with love, draped in elegance.",
    type: "website",
    siteName: "Azalea by Zehra",
    url: "https://azaleabyzehra.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Azalea by Zehra — Premium Indian Ethnic Wear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Azalea by Zehra — Draped in Elegance",
    description: "Premium Indian women's ethnic wear — Kurtis, Salwar Sets, Co-ord Sets & more.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Cloudinary serves all product images and videos — preconnect saves 100-300ms on first resource */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>

      {/* Google Analytics 4 */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}</Script>
        </>
      )}

      {/* Meta Pixel */}
      {META_PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${META_PIXEL_ID}');
            fbq('track','PageView');
          `}</Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
      <body className="antialiased overflow-x-hidden">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#FAF6EE",
              color: "#3D3D3D",
              border: "1px solid #F5EDE0",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#C9956C", secondary: "#FAF6EE" },
            },
          }}
        />
      </body>
    </html>
  );
}
