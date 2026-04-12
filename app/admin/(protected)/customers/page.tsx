export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Customers</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">{customers.length} registered customers</p>
      </div>

      <div className="bg-white border border-ivory-200 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-ivory-200">
            <tr>
              {["Name", "Contact", "Orders", "Joined"].map((h) => (
                <th key={h} className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory-200">
            {customers.map((customer: typeof customers[number]) => (
              <tr key={customer.id} className="hover:bg-ivory-200/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center font-inter text-xs text-rose-gold font-medium">
                      {customer.name?.[0] || customer.email?.[0] || "?"}
                    </div>
                    <span className="font-inter text-sm text-charcoal">{customer.name || "—"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-inter text-sm text-charcoal">{customer.email || "—"}</p>
                  <p className="font-inter text-xs text-mauve">{customer.phone || ""}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="font-inter text-sm text-charcoal">{customer._count.orders}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-inter text-sm text-charcoal-light">
                    {new Date(customer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-16">
            <p className="font-inter text-sm text-mauve">No customers yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
