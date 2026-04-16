"use client";

const messages = [
  "No Cash on Delivery — Online payment only",
  "All over India shipping available",
  "Shipping outside India? Contact us on WhatsApp or Instagram",
];

export default function AnnouncementBanner() {
  // Duplicate messages so the loop looks seamless
  const track = [...messages, ...messages];

  return (
    <div className="bg-charcoal text-ivory overflow-hidden h-8 flex items-center select-none">
      <div className="flex whitespace-nowrap animate-marquee">
        {track.map((msg, i) => (
          <span key={i} className="font-inter text-[11px] tracking-widest uppercase px-10">
            {msg}
            <span className="mx-10 text-rose-gold">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
