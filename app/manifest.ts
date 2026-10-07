import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Indus Gas Field App",
    short_name: "Indus Gas",
    description: "Field operations for Indus Gas employees.",
    start_url: "/field",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#0f5c4e",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
