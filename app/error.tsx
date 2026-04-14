"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-ivory min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="font-playfair text-6xl text-rose-gold/30 mb-6">Oops</p>
          <h1 className="font-playfair text-4xl text-charcoal mb-4">Something went wrong</h1>
          <p className="font-inter text-sm text-charcoal-light leading-relaxed mb-10">
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="btn-primary"
            >
              Try Again
            </button>
            <Link href="/" className="btn-outline">Back to Home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
