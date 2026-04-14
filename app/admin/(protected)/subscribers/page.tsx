export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Newsletter Subscribers</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">{subscribers.length} subscribers</p>
      </div>

      <div className="bg-white border border-ivory-200 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-ivory-200">
            <tr>
              <th className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">#</th>
              <th className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">Email</th>
              <th className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">Subscribed On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory-200">
            {subscribers.map((s, i) => (
              <tr key={s.id} className="hover:bg-ivory-200/30 transition-colors">
                <td className="px-6 py-4 font-inter text-sm text-mauve">{i + 1}</td>
                <td className="px-6 py-4 font-inter text-sm text-charcoal">{s.email}</td>
                <td className="px-6 py-4 font-inter text-sm text-charcoal-light">
                  {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && (
          <div className="text-center py-16">
            <p className="font-inter text-sm text-mauve">No subscribers yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
