import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://cekbar.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/profil/", "/pembayaran/", "/riwayat/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
