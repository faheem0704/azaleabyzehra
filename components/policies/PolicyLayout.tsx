import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Section {
  heading: string;
  content: React.ReactNode;
}

interface Props {
  title: string;
  lastUpdated: string;
  sections: Section[];
  breadcrumb: string;
}

export default function PolicyLayout({ title, lastUpdated, sections, breadcrumb }: Props) {
  return (
    <div className="pt-28 pb-24 section-padding">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-inter text-xs text-mauve mb-10">
        <Link href="/" className="hover:text-rose-gold transition-colors">Home</Link>
        <ChevronRight size={12} />
        <span className="text-charcoal">{breadcrumb}</span>
      </nav>

      <div className="max-w-2xl">
        <h1 className="font-playfair text-4xl text-charcoal mb-2">{title}</h1>
        <p className="font-inter text-xs text-mauve tracking-wide mb-12">Last updated: {lastUpdated}</p>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="font-playfair text-xl text-charcoal mb-4">{s.heading}</h2>
              <div className="font-inter text-sm text-charcoal-light leading-relaxed space-y-3">
                {s.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
