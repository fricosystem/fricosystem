import { useEffect } from 'react';

const Sitemap = () => {
  useEffect(() => {
    // Set the content type to XML
    document.title = 'Sitemap';
  }, []);

  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nexusblog.lovable.app/</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/posts</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/business</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/technology</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/podcast</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/shop</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/privacy</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://nexusblog.lovable.app/terms</loc>
    <lastmod>2025-09-22</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  return (
    <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '20px' }}>
      {sitemapXML}
    </div>
  );
};

export default Sitemap;