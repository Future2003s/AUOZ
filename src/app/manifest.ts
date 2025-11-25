import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LALA-LYCHEEE",
    short_name: "LALA",
    description: "CÔNG TY TNHH LALA-LYCHEEE",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d48",
    orientation: "portrait",
    lang: "vi",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
