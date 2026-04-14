export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: https://azaleabyzehra.vercel.app/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
