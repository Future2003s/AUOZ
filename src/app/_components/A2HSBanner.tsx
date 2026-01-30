"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "a2hs_dismiss_until";
const daysToMs = (d: number) => d * 24 * 60 * 60 * 1000;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    // iOS legacy
    // @ts-ignore
    window.navigator.standalone === true
  );
}

function dismissed() {
  if (typeof window === "undefined") return true;
  const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return Date.now() < until;
}

function dismissForDays(days: number) {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + daysToMs(days)));
}

export default function A2HSBanner() {
  const pathname = usePathname();

  // Chỉ hiện ở /vi/employee và sub-routes
  const eligibleRoute = useMemo(() => pathname?.startsWith("/vi/employee"), [pathname]);

  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "bip" | "none">("none");
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (!eligibleRoute) return;
    if (isStandalone() || dismissed()) return;

    // iOS: không có beforeinstallprompt -> show guide
    if (isIOS()) {
      setPlatform("ios");
      setShow(true);
      return;
    }

    // Android/Windows Chromium: chờ beforeinstallprompt
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setPlatform("bip");
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", onBIP as any);

    // fallback: nếu không bắn event (chưa đủ PWA), đừng show spam
    return () => window.removeEventListener("beforeinstallprompt", onBIP as any);
  }, [eligibleRoute]);

  // Ẩn nếu vừa được install
  useEffect(() => {
    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
      setPlatform("none");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!eligibleRoute || !show) return null;

  const close = (days = 7) => {
    dismissForDays(days);
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  return (
    <div style={styles.wrap}>
      <button onClick={() => close(14)} style={styles.close} aria-label="Đóng">✕</button>

      <div style={styles.row}>
        <div style={styles.icon}>LL</div>
        <div style={{ flex: 1 }}>
          <div style={styles.title}>Cài ứng dụng lên màn hình chính</div>

          {platform === "bip" ? (
            <div style={styles.desc}>
              Cài để mở nhanh hơn và dùng như app (Windows/Android).
            </div>
          ) : (
            <div style={styles.desc}>
              Trên iPhone/iPad: bấm <b>Share</b> (⬆︎) → <b>Add to Home Screen</b>.
            </div>
          )}

          <div style={styles.actions}>
            {platform === "bip" ? (
              <button onClick={install} style={styles.primary}>Cài đặt</button>
            ) : (
              <button
                onClick={() => alert("iOS Safari:\n1) Bấm Share (⬆︎)\n2) Add to Home Screen\n3) Add\n\nSau đó mở từ icon ngoài màn hình chính.")}
                style={styles.primary}
              >
                Hướng dẫn
              </button>
            )}

            <button onClick={() => close(3)} style={styles.secondary}>Để sau</button>
          </div>

          {platform === "bip" ? (
            <div style={styles.hint}>Nếu chưa thấy nút Cài đặt: kiểm tra manifest + service worker đã hoạt động.</div>
          ) : (
            <div style={styles.hint}>Lưu ý: iOS không có popup "Install" tự động trên browser.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    left: 16, right: 16, bottom: 16,
    background: "rgba(11,18,32,.96)",
    color: "#fff",
    border: "1px solid rgba(148,163,184,.25)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 12px 40px rgba(0,0,0,.35)",
    zIndex: 9999
  },
  row: { display: "flex", gap: 12, alignItems: "flex-start" },
  icon: {
    width: 44, height: 44, borderRadius: 12,
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800
  },
  title: { fontSize: 15, fontWeight: 750 },
  desc: { marginTop: 6, fontSize: 13, color: "#cbd5e1", lineHeight: 1.35 },
  actions: { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" },
  primary: { border: 0, borderRadius: 12, padding: "10px 12px", fontWeight: 750, cursor: "pointer", background: "#22c55e", color: "#052e16" },
  secondary: { border: 0, borderRadius: 12, padding: "10px 12px", fontWeight: 750, cursor: "pointer", background: "#334155", color: "#fff" },
  hint: { marginTop: 8, fontSize: 12, color: "#94a3b8" },
  close: {
    position: "absolute", top: 10, right: 10,
    width: 32, height: 32, borderRadius: 10,
    border: 0, cursor: "pointer",
    background: "rgba(255,255,255,.08)", color: "#fff"
  }
};
