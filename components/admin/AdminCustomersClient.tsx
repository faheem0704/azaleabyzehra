"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  _count: { orders: number };
};

export default function AdminCustomersClient({ customers: initial }: { customers: Customer[] }) {
  const [customers, setCustomers] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Remove "${label}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Customers</h1>
        <p className="font-inter text-sm text-charcoal-light mt-1">{customers.length} registered customers</p>
      </div>

      <div className="bg-white border border-ivory-200 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-ivory-200">
            <tr>
              {["Name", "Contact", "Orders", "Joined", ""].map((h, i) => (
                <th key={i} className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-ivory-200/30 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/admin/customers/${customer.id}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center font-inter text-xs text-rose-gold font-medium flex-shrink-0">
                      {customer.name?.[0] || customer.email?.[0] || "?"}
                    </div>
                    <span className="font-inter text-sm text-charcoal group-hover:text-rose-gold transition-colors">{customer.name || "—"}</span>
                  </Link>
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
                    {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(customer.id, customer.email || customer.name || customer.id)}
                    disabled={deletingId === customer.id}
                    className="text-mauve hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Delete customer"
                  >
                    <Trash2 size={15} />
                  </button>
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
