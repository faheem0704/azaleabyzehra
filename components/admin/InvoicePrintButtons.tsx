"use client";

export default function InvoicePrintButtons() {
  return (
    <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
      <button
        onClick={() => window.print()}
        className="bg-charcoal text-ivory font-inter text-sm px-6 py-2.5 hover:bg-charcoal-dark transition-colors"
      >
        Print / Save PDF
      </button>
      <a
        href="/admin/orders"
        className="border border-charcoal text-charcoal font-inter text-sm px-6 py-2.5 hover:bg-ivory-200 transition-colors"
      >
        ← Back
      </a>
    </div>
  );
}
