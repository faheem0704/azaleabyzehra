# AI Prompt — Convert Instagram Post to CSV Row

Use this prompt with **ChatGPT**, **Claude**, or **Gemini**.
Attach the screenshot of the Instagram post and send the message below.

---

## THE PROMPT (copy and paste this exactly)

```
I'm adding products to my e-commerce website. I have a screenshot of an Instagram post for a kurti/ethnic wear product. Please convert it into a single CSV row using EXACTLY this column format:

name,description,price,compareAtPrice,category_slug,sizes,colors,fabric,total_stock,featured,isNewArrival,images,image_alts,variants_size_color_stock_sku

RULES:
- name: Product name (create a good, SEO-friendly name if not obvious from post)
- description: 1-2 sentences describing the product. No line breaks or commas inside — use spaces only.
- price: Number only (no ₹ symbol). If price is in the caption use it. If not visible, leave as 0 and I'll fill it in.
- compareAtPrice: Original/crossed-out price if shown, otherwise leave empty
- category_slug: Pick ONE from this list based on the product type:
    kurtis, anarkalis, co-ords, dupattas, suits, tops, dresses
  (use lowercase, no spaces, use the closest match)
- sizes: Semicolon-separated. Default to: S;M;L;XL;XXL unless the post says otherwise
- colors: Semicolon-separated list of colors visible in the post or mentioned in caption
- fabric: Single fabric type if mentioned (Cotton, Lawn, Chiffon, Silk, Georgette, Linen, Karandi). Leave empty if unknown.
- total_stock: Leave as 50 (I'll update this)
- featured: false
- isNewArrival: true
- images: Leave empty (I'll add image URLs separately)
- image_alts: Leave empty
- variants_size_color_stock_sku: Leave empty (I'll fill this in if needed)

Output ONLY the CSV row — no headers, no explanation, no extra text. Just the single data row starting with the product name.

If any field is truly unknown, leave it empty (two consecutive commas).
```

---

## HOW TO USE

1. Open ChatGPT / Claude / Gemini
2. Click the **attach image** button (paperclip icon)
3. Upload your Instagram post screenshot
4. Paste the prompt above and hit send
5. Copy the output row
6. Paste it into your Google Sheet (below the header row)
7. Repeat for each product

---

## AFTER COLLECTING ALL ROWS

1. Open your Google Sheet
2. Make sure the first row is this header (copy exactly):
   ```
   id,name,description,price,compareAtPrice,category_slug,sizes,colors,fabric,total_stock,featured,isNewArrival,images,image_alts,variants_size_color_stock_sku
   ```
3. Fill in the `price` column for any rows where it was unknown
4. Add your Cloudinary image URLs to the `images` column (semicolon-separated if multiple)
5. Download as **CSV** (File → Download → Comma Separated Values)
6. Go to your admin panel → Products → Import CSV → upload the file

---

## CATEGORY SLUGS — check your admin panel

Go to `/admin/categories` to see your exact category slugs.
Common ones for kurti shops:
| Category Name | Slug to use |
|---|---|
| Kurtis | `kurtis` |
| Anarkalis | `anarkalis` |
| Co-ords / Sets | `co-ords` |
| Suits | `suits` |
| Dupattas | `dupattas` |

---

## IMAGE TIPS

Instagram URLs expire and block hotlinking — you MUST re-upload images. 

**Free option — Cloudinary:**
1. Go to cloudinary.com → sign up free
2. Upload → select all product photos
3. Click each image → copy the URL (looks like `https://res.cloudinary.com/your-name/image/upload/v.../filename.jpg`)
4. Paste into the `images` column in your sheet

Multiple images for one product: separate with semicolons
```
https://cloudinary.com/.../front.jpg;https://cloudinary.com/.../back.jpg
```

---

## EXAMPLE OUTPUT FROM AI

For a post showing a white floral lawn kurti priced at ₹1,299, the AI should give you:

```
Floral Lawn Kurti,Delicate floral embroidered lawn kurti perfect for summer and casual occasions.,1299,,kurtis,S;M;L;XL;XXL,White,Lawn,50,false,true,,,
```
