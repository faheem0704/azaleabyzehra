import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Cloudinary URL-based watermark layers:
//   1. Diagonal tiled ghost — covers the whole image so cropping doesn't help
//   2. Solid corner brand   — clear visible attribution bottom-right
// The original file in Cloudinary storage stays clean; the transformation is
// applied on-the-fly by Cloudinary's CDN and cached automatically.
const WATERMARK_LAYERS = [
  // layer 1 — faint diagonal tile
  "l_text:Arial_18:Azalea_by_Zehra,co_white,o_15,g_center,a_-25,fl_tiled",
  // layer 2 — corner brand
  "l_text:Arial_22_bold:Azalea_by_Zehra,co_white,o_60,g_south_east,x_18,y_18",
].join("/");

function applyWatermark(url: string): string {
  // Insert transformation layers between /upload/ and the version/public_id
  return url.replace("/upload/", `/upload/${WATERMARK_LAYERS}/`);
}

export async function uploadImage(
  file: string,
  folder = "azalea-by-zehra/products"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    quality: "auto",
    fetch_format: "auto",
  });
  // Return watermarked URL — original stays clean in Cloudinary
  return { url: applyWatermark(result.secure_url), publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
