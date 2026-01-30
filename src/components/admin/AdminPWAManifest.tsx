"use client";

import { useEffect } from "react";

export function AdminPWAManifest() {
  useEffect(() => {
    // Remove existing manifest link if any
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (existingLink) {
      existingLink.remove();
    }

    // Add admin manifest
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest-admin.webmanifest";
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount
      const linkToRemove = document.querySelector('link[rel="manifest"][href="/manifest-admin.webmanifest"]');
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, []);

  return null;
}
