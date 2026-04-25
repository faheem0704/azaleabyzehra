"use client";

import Link from "next/link";

export default function OrdersError({ reset }: { reset: () => void }) {
  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-4xl mx-auto text-center py-24 border border-ivory-200">
        <p className="font-playfair text-4xl text-charcoal mb-4">Could not load orders</p>
        <p className="font-inter text-sm text-mauve mb-8">
          There was a problem fetching your orders. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="btn-primary">Try Again</button>
          <Link href="/" className="btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
