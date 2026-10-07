import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/field",
    name: "Indus Gas Field App",
    short_name: "Indus Gas",
    description: "Field operations for Indus Gas employees.",
    start_url: "/field",
    scope: "/field",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#0f5c4e",
    icons: [
      { src: "/api/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
