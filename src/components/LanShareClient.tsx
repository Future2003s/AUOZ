"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { envConfig } from "@/config";

type FileItem = {
  name: string;
  size: number;
  mtimeMs: number;
};

type UploadProgress = {
  fileName: string;
  loaded: number;
  total: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
};

type LanChangeEvent =
  | {
      type: "upload";
      uploaded: { name: string; size: number }[];
    }
  | {
      type: "delete";
      name: string;
    };

const humanSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const extToEmoji: Record<string, string> = {
  pdf: "📄",
  doc: "📄",
  docx: "📄",
  xls: "📊",
  xlsx: "📊",
  csv: "📊",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
  gif: "🖼️",
  webp: "🖼️",
  mp4: "🎞️",
  mov: "🎞️",
  mp3: "🎵",
  wav: "🎵",
  zip: "🗜️",
  rar: "🗜️",
  "7z": "🗜️",
};

const getFileIcon = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return extToEmoji[ext] || "📁";
};

const getLanBaseUrl = () => {
  if (envConfig.NEXT_PUBLIC_LAN_API_BASE) {
    return envConfig.NEXT_PUBLIC_LAN_API_BASE.replace(/\/+$/, "");
  }
  // Fallback: use backend URL if LAN base not set explicitly
  return envConfig.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, "");
};

export default function LanShareClient() {
  const lanApiBase = useMemo(() => getLanBaseUrl(), []);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [sseConnected, setSseConnected] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [accessUrl, setAccessUrl] = useState<string>("");

  const authParams = useMemo(() => {
    const headers: Record<string, string> = {};
    const query = new URLSearchParams();
    if (pin.trim()) {
      headers["X-PIN"] = pin.trim();
      query.set("pin", pin.trim());
    }
    return { headers, query };
  }, [pin]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      void listFiles();
    }, 3000);
  };

  const listFiles = async () => {
    setIsLoading(true);
    setPinError(null);
    try {
      const url = `${lanApiBase}/api/lan/files?${
        authParams.query.toString() || ""
      }`;
      const res = await fetch(url, {
        headers: {
          ...(authParams.headers || {}),
        },
      });
      if (res.status === 401) {
        setPinError("PIN không đúng hoặc thiếu.");
        setFiles([]);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = (await res.json()) as { files: FileItem[] };
      setFiles(
        (data.files || []).sort((a, b) => b.mtimeMs - a.mtimeMs)
      );
    } catch (err) {
      console.error("Failed to list files", err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);

    // Upload tuần tự để progress dễ hiểu
    const uploadNext = (index: number) => {
      if (index >= filesArray.length) {
        setUploadProgress(null);
        void listFiles();
        return;
      }

      const file = filesArray[index];
      const xhr = new XMLHttpRequest();
      const url = `${lanApiBase}/api/lan/upload?${
        authParams.query.toString() || ""
      }`;

      xhr.open("POST", url, true);
      if (authParams.headers["X-PIN"]) {
        xhr.setRequestHeader("X-PIN", authParams.headers["X-PIN"]);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress({
            fileName: file.name,
            loaded: event.loaded,
            total: event.total,
            status: "uploading",
          });
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            setUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    status: "success",
                  }
                : null
            );
            // tải file tiếp theo
            uploadNext(index + 1);
          } else if (xhr.status === 401) {
            setUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    status: "error",
                    errorMessage: "PIN không đúng hoặc thiếu.",
                  }
                : null
            );
            setPinError("PIN không đúng hoặc thiếu.");
          } else if (xhr.status === 413) {
            setUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    status: "error",
                    errorMessage: "File vượt quá dung lượng cho phép.",
                  }
                : null
            );
          } else {
            setUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    status: "error",
                    errorMessage: "Lỗi khi upload file.",
                  }
                : null
            );
          }
        }
      };

      const form = new FormData();
      form.append("files", file);
      xhr.send(form);
    };

    uploadNext(0);
  };

  const deleteFile = async (name: string) => {
    if (!window.confirm(`Xoá file "${name}"?`)) return;
    setPinError(null);
    try {
      const url = `${lanApiBase}/api/lan/files/${encodeURIComponent(
        name
      )}?${authParams.query.toString() || ""}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          ...(authParams.headers || {}),
        },
      });
      if (res.status === 401) {
        setPinError("PIN không đúng hoặc thiếu.");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to delete file");
      }
      await listFiles();
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  };

  const setupSse = () => {
    // Cleanup cũ
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const url = `${lanApiBase}/api/lan/events?${
        authParams.query.toString() || ""
      }`;
      const es = new EventSource(url, { withCredentials: false });
      eventSourceRef.current = es;

      es.onopen = () => {
        setSseConnected(true);
        stopPolling();
      };

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        eventSourceRef.current = null;
        // fallback polling
        startPolling();
      };

      es.addEventListener("changed", (evt) => {
        try {
          const data = JSON.parse((evt as MessageEvent).data) as LanChangeEvent;
          if (data.type === "upload" || data.type === "delete") {
            void listFiles();
          }
        } catch (err) {
          console.error("Failed to parse SSE event", err);
        }
      });
    } catch (err) {
      console.error("Failed to setup SSE", err);
      setSseConnected(false);
      startPolling();
    }
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.files && dt.files.length > 0) {
      uploadFiles(dt.files);
      dt.clearData();
    }
  };

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const copyAccessLink = async () => {
    const url = accessUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Đã copy link truy cập vào clipboard.");
    } catch (err) {
      console.error("Failed to copy", err);
      alert("Không copy được link, vui lòng copy thủ công.");
    }
  };

  useEffect(() => {
    void listFiles();
    setupSse();

    // access URL hiển thị + copy: dùng URL hiện tại trên trình duyệt
    if (typeof window !== "undefined") {
      setAccessUrl(window.location.href);
    } else {
      setAccessUrl(
        `${envConfig.NEXT_PUBLIC_URL.replace(/\/+$/, "")}/lan-share`
      );
    }

    return () => {
      stopPolling();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authParams.query.toString()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 sm:py-6">
      <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
          LAN Share – Chia sẻ file nội bộ
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Kết nối các thiết bị trong cùng mạng Wi-Fi / LAN để gửi file nhanh
          chóng (không cần Internet ngoài).
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-medium text-slate-800">Địa chỉ truy cập</div>
          <div className="break-all font-mono text-[11px] text-slate-700 sm:text-xs">
            {accessUrl}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 sm:text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <span>
              {sseConnected
                ? "Realtime: SSE đã kết nối"
                : "Realtime: đang dùng polling 3s"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={copyAccessLink}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 sm:mt-0 sm:text-sm"
        >
          Copy link
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-slate-700 sm:text-sm">
            PIN (nếu backend yêu cầu)
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-inner outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:h-10 sm:px-3 sm:text-sm"
            placeholder="Nhập PIN nếu có"
          />
          {pinError && (
            <p className="text-[11px] text-red-500 sm:text-xs">{pinError}</p>
          )}
        </div>
        <div className="flex flex-none flex-col items-stretch gap-2 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 sm:text-sm"
          >
            Chọn file
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>
      </div>

      <div
        className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center text-xs text-slate-500 transition hover:border-slate-400 hover:bg-slate-100 sm:min-h-[150px] sm:text-sm"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-3xl">⬆️</div>
        <div className="font-medium text-slate-800">
          Kéo – thả file vào đây
        </div>
        <div>hoặc chạm để chọn file từ thiết bị</div>
      </div>

      {uploadProgress && (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="font-medium text-slate-800">
              Đang xử lý: {uploadProgress.fileName}
            </div>
            <div className="text-[11px] text-slate-500 sm:text-xs">
              {uploadProgress.total > 0
                ? `${Math.round(
                    (uploadProgress.loaded / uploadProgress.total) * 100
                  )}%`
                : null}
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${
                uploadProgress.status === "error"
                  ? "bg-red-400"
                  : uploadProgress.status === "success"
                  ? "bg-emerald-500"
                  : "bg-slate-900"
              }`}
              style={{
                width:
                  uploadProgress.total > 0
                    ? `${Math.round(
                        (uploadProgress.loaded / uploadProgress.total) * 100
                      )}%`
                    : "0%",
              }}
            />
          </div>
          {uploadProgress.errorMessage && (
            <p className="mt-2 text-[11px] text-red-500 sm:text-xs">
              {uploadProgress.errorMessage}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-[13px]">
            Danh sách file ({files.length})
          </div>
          <button
            type="button"
            onClick={() => listFiles()}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:text-xs"
          >
            Làm mới
          </button>
        </div>

        <div className="max-h-[320px] space-y-1 overflow-y-auto text-xs sm:text-sm">
          {isLoading && files.length === 0 && (
            <div className="py-4 text-center text-slate-400">
              Đang tải danh sách file...
            </div>
          )}
          {!isLoading && files.length === 0 && (
            <div className="py-4 text-center text-slate-400">
              Chưa có file nào. Hãy upload file từ thiết bị bất kỳ trong mạng
              LAN.
            </div>
          )}

          {files.map((f) => {
            const mtime = new Date(f.mtimeMs);
            const downloadHref = `${
              lanApiBase
            }/api/lan/download/${encodeURIComponent(f.name)}${
              authParams.query.toString()
                ? `?${authParams.query.toString()}`
                : ""
            }`;
            return (
              <div
                key={f.name + f.mtimeMs}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-base">
                  {getFileIcon(f.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-slate-800 sm:text-sm">
                    {f.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:text-xs">
                    <span>{humanSize(f.size)}</span>
                    <span>•</span>
                    <span>
                      {mtime.toLocaleDateString()} {mtime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  <a
                    href={downloadHref}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:text-xs"
                  >
                    Tải
                  </a>
                  <button
                    type="button"
                    onClick={() => void deleteFile(f.name)}
                    className="inline-flex items-center justify-center rounded-full border border-red-100 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 sm:text-xs"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

