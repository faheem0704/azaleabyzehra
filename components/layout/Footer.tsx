import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getStoreSettings() {
  try {
    let s = await prisma.settings.findFirst();
    if (!s) s = await prisma.settings.create({ data: {} });
    return s;
  } catch {
    return null;
  }
}

export default async function Footer() {
  const settings = await getStoreSettings();
  const phone = settings?.phone || "+91 900 123 4567";
  const email = settings?.contactEmail || "hello@azaleabyzehra.com";
  const address = settings?.address || "123 Fashion Street, Bandra West, Mumbai, India";
  const whatsapp = (settings?.whatsappNumber || "+91-900-000-0000").replace(/\D/g, "");

  return (
    <footer className="bg-charcoal-dark text-ivory/80 mt-24">
      <div className="section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="font-playfair text-2xl text-ivory mb-4">
              Azalea <span className="text-rose-gold">by Zehra</span>
            </h3>
            <p className="text-sm font-inter leading-relaxed text-ivory/60 mb-6">
              Draped in elegance. Crafted with love. India&apos;s premium destination for women&apos;s ethnic wear.
            </p>
            <div className="flex gap-4">
              {/* Instagram */}
              <a href="https://www.instagram.com/azalea_by_zehra?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-ivory/20 flex items-center justify-center text-ivory/60 hover:border-rose-gold hover:text-rose-gold transition-all duration-300" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/azaleabyzehra" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-ivory/20 flex items-center justify-center text-ivory/60 hover:border-rose-gold hover:text-rose-gold transition-all duration-300" aria-label="Facebook">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              {/* Pinterest */}
              <a href="https://pinterest.com/azaleabyzehra" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-ivory/20 flex items-center justify-center text-ivory/60 hover:border-rose-gold hover:text-rose-gold transition-all duration-300" aria-label="Pinterest">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-inter text-xs tracking-[0.2em] uppercase text-ivory/40 mb-6">Shop</h4>
            <ul className="space-y-3">
              {[
                { label: "All Products", href: "/products" },
                { label: "New Arrivals", href: "/new-arrivals" },
                { label: "Kurtis", href: "/products?category=kurtis" },
                { label: "Salwar Sets", href: "/products?category=salwar-sets" },
                { label: "Co-ord Sets", href: "/products?category=coord-sets" },
                { label: "Dupattas", href: "/products?category=dupattas" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-inter text-ivory/60 hover:text-rose-gold transition-colors duration-200">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-inter text-xs tracking-[0.2em] uppercase text-ivory/40 mb-6">Information</h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/about" },
                { label: "Help & FAQ", href: "/help" },
                { label: "Shipping Policy", href: "/policies/shipping" },
                { label: "Returns & Exchanges", href: "/policies/returns" },
                { label: "Refund Policy", href: "/policies/refunds" },
                { label: "Terms of Service", href: "/policies/terms" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-inter text-ivory/60 hover:text-rose-gold transition-colors duration-200">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — live from DB */}
          <div>
            <h4 className="font-inter text-xs tracking-[0.2em] uppercase text-ivory/40 mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm font-inter text-ivory/60">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-rose-gold" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-inter">
                <Phone size={16} className="flex-shrink-0 text-rose-gold" />
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-ivory/60 hover:text-rose-gold transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3 text-sm font-inter">
                <Mail size={16} className="flex-shrink-0 text-rose-gold" />
                <a href={`mailto:${email}`} className="text-ivory/60 hover:text-rose-gold transition-colors">{email}</a>
              </li>
            </ul>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 border border-green-500/50 text-green-400 px-4 py-2.5 text-sm font-inter hover:bg-green-500/10 transition-colors duration-200">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="section-padding py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-inter text-ivory/40">© {new Date().getFullYear()} Azalea by Zehra. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <img src="/visa.svg" alt="Visa" className="h-5 opacity-40" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-5 opacity-40" />
            <img src="/razorpay.svg" alt="Razorpay" className="h-5 opacity-40" />
          </div>
        </div>
      </div>
    </footer>
  );
}
