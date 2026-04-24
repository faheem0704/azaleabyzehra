import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "…";
}

export function getDiscountPercent(price: number, compareAtPrice: number): number {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export const COURIERS = [
  { name: "Delhivery", value: "delhivery" },
  { name: "DTDC", value: "dtdc" },
  { name: "BlueDart", value: "bluedart" },
  { name: "Ekart", value: "ekart" },
  { name: "Xpressbees", value: "xpressbees" },
  { name: "Ecom Express", value: "ecom_express" },
  { name: "India Post", value: "india_post" },
  { name: "Shadowfax", value: "shadowfax" },
  { name: "Other", value: "other" },
] as const;

export function getTrackingUrl(courier: string, awb: string): string | null {
  switch (courier) {
    case "delhivery":   return `https://www.delhivery.com/track/package/${awb}`;
    case "dtdc":        return `https://www.dtdc.in/tracking.asp?awb=${awb}`;
    case "bluedart":    return `https://www.bluedart.com/tracking/${awb}`;
    case "ekart":       return `https://ekartlogistics.com/shipmenttrack/${awb}`;
    case "xpressbees":  return `https://www.xpressbees.com/shipment/tracking/${awb}`;
    case "ecom_express":return `https://ecomexpress.in/tracking/?awb_field=${awb}`;
    case "shadowfax":   return `https://tracker.shadowfax.in/?orderNumber=${awb}`;
    case "india_post":  return `https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx`;
    default:            return null;
  }
}
