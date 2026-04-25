"use client";

import { useRef, useState } from "react";
import { Upload, ChevronUp, ChevronDown, X } from "lucide-react";
import toast from "react-hot-toast";

export type ImageEntry = { url: string; alt: string; colorTag?: string };

interface Props {
  images: ImageEntry[];
  setImages: React.Dispatch<React.SetStateAction<ImageEntry[]>>;
  parsedColors: string[];
}

export default function ProductImageManager({ images, setImages, parsedColors }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const uploaded: ImageEntry[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploaded.push({ url: data.url, alt: "" });
      }
      setImages((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  };

  const updateImageAlt = (i: number, alt: string) => {
    setImages((prev) => prev.map((img, idx) => (idx === i ? { ...img, alt } : img)));
  };

  const updateImageColor = (i: number, colorTag: string) => {
    setImages((prev) => prev.map((img, idx) => (idx === i ? { ...img, colorTag } : img)));
  };

  return (
    <div>
      <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-4">
        Product Images
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-ivory-200 p-8 text-center cursor-pointer hover:border-rose-gold transition-colors mb-4"
      >
        <Upload size={24} className="mx-auto text-mauve mb-2" />
        <p className="font-inter text-sm text-charcoal-light">Click to upload images</p>
        <p className="font-inter text-xs text-mauve mt-1">JPG, PNG, WebP — First image is thumbnail</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
      {uploading && <p className="text-sm font-inter text-rose-gold mb-3">Uploading…</p>}

      <div className="space-y-3">
        {images.map((img, i) => (
          <div key={img.url} className="flex gap-3 border border-ivory-200 p-3">
            <div className="relative w-16 h-20 flex-shrink-0 bg-ivory-200 overflow-hidden">
              <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-rose-gold text-white text-[9px] font-inter text-center py-0.5">
                  Thumbnail
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={img.alt}
                onChange={(e) => updateImageAlt(i, e.target.value)}
                placeholder="Alt text (for SEO & accessibility)"
                className="w-full border border-ivory-200 px-2 py-1.5 text-xs font-inter focus:outline-none focus:border-rose-gold"
              />
              {parsedColors.length > 0 && (
                <select
                  value={img.colorTag ?? ""}
                  onChange={(e) => updateImageColor(i, e.target.value)}
                  className="w-full mt-1.5 border border-ivory-200 px-2 py-1.5 text-xs font-inter focus:outline-none focus:border-rose-gold bg-white text-charcoal"
                >
                  <option value="">All colors</option>
                  {parsedColors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => moveImage(i, -1)}
                disabled={i === 0}
                className="w-6 h-6 flex items-center justify-center text-mauve hover:text-charcoal disabled:opacity-20"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => moveImage(i, 1)}
                disabled={i === images.length - 1}
                className="w-6 h-6 flex items-center justify-center text-mauve hover:text-charcoal disabled:opacity-20"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="w-6 h-6 flex items-center justify-center text-mauve hover:text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <p className="font-inter text-xs text-mauve text-center py-4">No images yet</p>
        )}
      </div>
    </div>
  );
}
