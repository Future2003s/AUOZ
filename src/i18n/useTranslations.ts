import { useI18n } from "./I18nProvider";

export default function useTranslations() {
  const { messages } = useI18n();

  return (path: string, fallback?: string): string => {
    if (!path) return fallback ?? "";

    const segments = path.split(".");
    let current: any = messages;

    for (const segment of segments) {
      if (!current || typeof current !== "object") {
        return fallback ?? path; // fallback to provided default or key if path not found
      }
      current = current[segment];
    }

    return typeof current === "string" ? current : (fallback ?? path);
  };
}
