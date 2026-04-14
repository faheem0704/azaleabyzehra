import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center section-padding">
        <div className="text-center max-w-md">
          <p className="font-playfair text-8xl text-rose-gold/30 mb-6">404</p>
          <h1 className="font-playfair text-4xl text-charcoal mb-4">Page Not Found</h1>
          <p className="font-inter text-sm text-charcoal-light leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary">Back to Home</Link>
            <Link href="/products" className="btn-outline">Shop Collection</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
