import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hồ sơ sức khỏe",
    short_name: "Hồ sơ SK",
    description: "Lưu trữ hồ sơ khám bệnh của gia đình một cách an toàn.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fb",
    theme_color: "#2563eb",
    lang: "vi",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
