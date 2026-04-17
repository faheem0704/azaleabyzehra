import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
