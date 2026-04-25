"use client";

const vkey = (size: string, color: string) => `${size}||${color}`;

interface Props {
  sizes: string[];
  colors: string[];
  variantStock: Record<string, number>;
  variantSku: Record<string, string>;
  onStockChange: (key: string, value: number) => void;
  onSkuChange: (key: string, value: string) => void;
}

export default function VariantStockGrid({
  sizes,
  colors,
  variantStock,
  variantSku,
  onStockChange,
  onSkuChange,
}: Props) {
  const totalStock = sizes
    .flatMap((s) => colors.map((c) => variantStock[vkey(s, c)] ?? 0))
    .reduce((a, b) => a + b, 0);

  return (
    <div>
      <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-3">
        Stock per Variant
      </label>
      <div className="border border-ivory-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ivory-200/50">
              <th className="px-3 py-2 text-left font-inter text-xs text-charcoal-light font-normal">
                Size / Color
              </th>
              {colors.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-center font-inter text-xs text-charcoal font-medium min-w-[80px]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory-200">
            {sizes.map((s) => (
              <tr key={s} className="hover:bg-ivory-200/20">
                <td className="px-3 py-2 font-inter text-xs font-medium text-charcoal">{s}</td>
                {colors.map((c) => {
                  const k = vkey(s, c);
                  return (
                    <td key={c} className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        value={variantStock[k] ?? 0}
                        onChange={(e) =>
                          onStockChange(k, Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-full border border-ivory-200 px-2 py-1.5 text-center text-sm font-inter focus:outline-none focus:border-rose-gold"
                      />
                      <input
                        type="text"
                        value={variantSku[k] ?? ""}
                        onChange={(e) => onSkuChange(k, e.target.value.toUpperCase())}
                        placeholder="SKU"
                        title="Stock Keeping Unit — must be globally unique"
                        className="w-full mt-1 border border-ivory-200 px-2 py-1 text-center text-[11px] font-inter focus:outline-none focus:border-rose-gold text-charcoal-light placeholder:text-ivory-200 tracking-wider"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-inter text-xs text-mauve mt-2">Total stock: {totalStock} units</p>
    </div>
  );
}
