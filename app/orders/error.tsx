"use client";

import Link from "next/link";

export default function OrdersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-4xl mx-auto text-center py-24 border border-ivory-200">
        <p className="font-playfair text-4xl text-charcoal mb-4">Could not load orders</p>
        <p className="font-inter text-sm text-mauve mb-8">
          There was a problem fetching your orders. Please try again.
        </p>
        {/* Temporary: show error detail so we can diagnose the root cause */}
        {error?.message && (
          <p className="font-mono text-xs text-red-500 bg-red-50 border border-red-200 px-4 py-2 mb-6 text-left break-all">
            {error.message}{error.digest ? ` (digest: ${error.digest})` : ""}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="btn-primary">Try Again</button>
          <Link href="/" className="btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
