"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Download,
    Globe,
    FolderPlus,
    Menu,
    X,
    Save,
    RefreshCw,
    Search,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Loader2,
    Upload,
    FileJson,
} from "lucide-react";
import {
    fetchI18nList,
    bulkImportI18n,
    upsertI18nKey,
    deleteI18nKey,
    flatListToSections,
    getExportUrl,
} from "@/apiRequests/i18nEditor";

// ─── Types ───────────────────────────────────────────────────────────────────

type Locale = "vi" | "en" | "ja";
type Sections = Record<string, Record<string, string>>;
type DirtyMap = Record<string, Record<string, boolean>>;
type SavingMap = Record<string, boolean>; // key → saving

interface LangDef {
    code: Locale;
    label: string;
    flag: string;
}

const LANGS: LangDef[] = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
];

// ─── Toast helper ─────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";
interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JsonEditorPage() {
    const router = useRouter();
    const [currentLang, setCurrentLang] = useState<Locale>("vi");
    const [sections, setSections] = useState<Sections>({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // UI state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    // Add new key/section
    const [newKeyInput, setNewKeyInput] = useState<{ section: string | null; value: string }>({ section: null, value: "" });
    const [newSectionName, setNewSectionName] = useState("");
    const [isAddingSection, setIsAddingSection] = useState(false);

    // Saving state per key  
    const [savingKeys, setSavingKeys] = useState<SavingMap>({});
    const [dirtyKeys, setDirtyKeys] = useState<DirtyMap>({});

    // Import modal state
    const [showImport, setShowImport] = useState(false);
    const [importTab, setImportTab] = useState<"paste" | "file">("paste");
    const [importLocale, setImportLocale] = useState<Locale | "all">("all");
    const [importText, setImportText] = useState("");
    const [importError, setImportError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Toast notifications
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = ++toastCounter.current;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    }, []);

    // ─── Load data ──────────────────────────────────────────────────────────────

    const loadLocale = useCallback(async (locale: Locale) => {
        setLoading(true);
        setGlobalError(null);
        try {
            const res = await fetchI18nList(locale, 1, 1000);
            if (res.success) {
                setSections(flatListToSections(res.data));
                setDirtyKeys({});
            } else {
                setGlobalError(`Không thể tải dữ liệu locale "${locale}"`);
            }
        } catch (e: any) {
            setGlobalError(e.message || "Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLocale(currentLang);
    }, [currentLang, loadLocale]);

    // ─── Edit value (local state only) ──────────────────────────────────────────

    const updateLocalValue = (section: string, subKey: string, value: string) => {
        setSections((prev) => ({
            ...prev,
            [section]: { ...prev[section], [subKey]: value },
        }));
        setDirtyKeys((prev) => ({
            ...prev,
            [section]: { ...(prev[section] || {}), [subKey]: true },
        }));
    };

    // ─── Save single key ─────────────────────────────────────────────────────────

    const saveKey = async (section: string, subKey: string) => {
        const fullKey = section === "__root__" ? subKey : `${section}.${subKey}`;
        const value = sections[section]?.[subKey] ?? "";
        const saveId = fullKey;

        setSavingKeys((prev) => ({ ...prev, [saveId]: true }));
        try {
            await upsertI18nKey(currentLang, fullKey, value);
            setDirtyKeys((prev) => ({
                ...prev,
                [section]: { ...(prev[section] || {}), [subKey]: false },
            }));
            addToast("success", `Đã lưu "${fullKey}"`);
        } catch {
            addToast("error", `Lỗi khi lưu "${fullKey}"`);
        } finally {
            setSavingKeys((prev) => {
                const next = { ...prev };
                delete next[saveId];
                return next;
            });
            router.refresh();
        }
    };

    // ─── Save all dirty keys ─────────────────────────────────────────────────────

    const saveAllDirty = async () => {
        const pairs: { section: string; subKey: string }[] = [];
        for (const [section, keys] of Object.entries(dirtyKeys)) {
            for (const [subKey, isDirty] of Object.entries(keys)) {
                if (isDirty) pairs.push({ section, subKey });
            }
        }
        if (pairs.length === 0) { addToast("info", "Không có thay đổi nào"); return; }

        await Promise.all(pairs.map(({ section, subKey }) => saveKey(section, subKey)));
        addToast("success", `Đã lưu ${pairs.length} keys`);
        router.refresh();
    };

    // ─── Delete key ──────────────────────────────────────────────────────────────

    const handleDeleteKey = async (section: string, subKey: string) => {
        const fullKey = section === "__root__" ? subKey : `${section}.${subKey}`;
        if (!confirm(`Xóa key "${fullKey}" khỏi tất cả ngôn ngữ?`)) return;

        // Delete from all locales
        try {
            await Promise.all(
                LANGS.map((l) => deleteI18nKey(l.code, fullKey).catch(() => null))
            );

            setSections((prev) => {
                const next = { ...prev };
                if (next[section]) {
                    const s = { ...next[section] };
                    delete s[subKey];
                    if (Object.keys(s).length === 0) delete next[section];
                    else next[section] = s;
                }
                return next;
            });
            addToast("success", `Đã xóa "${fullKey}"`);
            router.refresh();
        } catch {
            addToast("error", `Lỗi khi xóa "${fullKey}"`);
        }
    };

    // ─── Add new key ────────────────────────────────────────────────────────────

    const handleAddKey = async (section: string) => {
        const subKey = newKeyInput.value.trim().replace(/\s+/g, "_");
        if (!subKey) return;

        const fullKey = section === "__root__" ? subKey : `${section}.${subKey}`;
        // Add empty value for all locales
        try {
            await Promise.all(
                LANGS.map((l) => upsertI18nKey(l.code, fullKey, ""))
            );

            setSections((prev) => ({
                ...prev,
                [section]: { ...(prev[section] || {}), [subKey]: "" },
            }));
            setNewKeyInput({ section: null, value: "" });
            addToast("success", `Đã thêm key "${fullKey}"`);
            router.refresh();
        } catch {
            addToast("error", `Lỗi khi thêm key "${fullKey}"`);
        }
    };

    // ─── Add new section ─────────────────────────────────────────────────────────

    const handleAddSection = () => {
        const sectionName = newSectionName.trim().toLowerCase().replace(/\s+/g, "_");
        if (!sectionName) return;

        setSections((prev) => ({ ...prev, [sectionName]: {} }));
        setNewSectionName("");
        setIsAddingSection(false);
    };

    // ─── Delete section ──────────────────────────────────────────────────────────

    const handleDeleteSection = async (section: string) => {
        if (!confirm(`Xóa toàn bộ section "${section}"?`)) return;

        const keys = Object.keys(sections[section] || {});
        try {
            await Promise.all(
                keys.flatMap((subKey) => {
                    const fullKey = section === "__root__" ? subKey : `${section}.${subKey}`;
                    return LANGS.map((l) => deleteI18nKey(l.code, fullKey).catch(() => null));
                })
            );
            setSections((prev) => {
                const next = { ...prev };
                delete next[section];
                return next;
            });
            addToast("success", `Đã xóa section "${section}"`);
            router.refresh();
        } catch {
            addToast("error", `Lỗi khi xóa section "${section}"`);
        }
    };

    // ─── Download from API ───────────────────────────────────────────────────────

    const handleExport = (locale: Locale) => {
        window.open(getExportUrl(locale), "_blank");
    };

    // ─── Import JSON ─────────────────────────────────────────────────────────────

    const parseImportText = (text: string): Record<string, any> | null => {
        try {
            const parsed = JSON.parse(text.trim());
            if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
            return parsed;
        } catch {
            return null;
        }
    };

    const countFlatKeys = (obj: Record<string, any>, prefix = ""): number => {
        let count = 0;
        for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (typeof v === "object" && v !== null && !Array.isArray(v)) {
                count += countFlatKeys(v, fullKey);
            } else {
                count++;
            }
        }
        return count;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setImportText(text);
            setImportError(null);
            setImportTab("paste"); // show parsed text
        };
        reader.readAsText(file, "utf-8");
        e.target.value = "";
    };

    const handleImport = async () => {
        const parsed = parseImportText(importText);
        if (!parsed) {
            setImportError("JSON không hợp lệ — kiểm tra lại cú pháp.");
            return;
        }
        setImporting(true);
        setImportError(null);
        try {
            const targets: Locale[] = importLocale === "all" ? ["vi", "en", "ja"] : [importLocale];
            await Promise.all(targets.map((loc) => bulkImportI18n(loc, parsed)));
            addToast("success", `Đã import ${countFlatKeys(parsed)} keys vào ${targets.join(", ")}`);
            setShowImport(false);
            setImportText("");
            await loadLocale(currentLang); // refresh editor
            router.refresh();
        } catch (e: any) {
            setImportError(e.message || "Lỗi khi import");
        } finally {
            setImporting(false);
        }
    };

    // ─── Filter sections by search ───────────────────────────────────────────────

    const filteredSections: Sections = searchQuery
        ? (Object.fromEntries(
            (Object.entries(sections) as [string, Record<string, string>][])
                .map(([section, keys]): [string, Record<string, string>] => [
                    section,
                    Object.fromEntries(
                        Object.entries(keys).filter(
                            ([k, v]) =>
                                k.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                v.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                section.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                    ) as Record<string, string>,
                ])
                .filter(([, keys]) => Object.keys(keys).length > 0)
        ) as Sections)
        : sections;

    const dirtyCount = Object.values(dirtyKeys).reduce(
        (acc, keys) => acc + Object.values(keys).filter(Boolean).length,
        0
    );

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">

            {/* Toast notifications */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium backdrop-blur-sm border transition-all pointer-events-auto
              ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                t.type === "error" ? "bg-red-50 text-red-800 border-red-200" :
                                    "bg-blue-50 text-blue-800 border-blue-200"}`}
                    >
                        {t.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
                            t.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> :
                                <Globe className="w-4 h-4 shrink-0" />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-800/20 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl lg:shadow-sm transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static lg:block"}`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-start lg:block">
                    <div>
                        <h1 className="text-xl font-bold text-rose-600 flex items-center gap-2">
                            <Globe className="w-6 h-6" />
                            <span>LALA-LYCHEE</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Quản lý bản dịch (i18n editor)
                        </p>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Lang selector */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                        Chọn ngôn ngữ để chỉnh sửa
                    </div>
                    {LANGS.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => { setCurrentLang(lang.code); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentLang === lang.code
                                ? "bg-rose-50 text-rose-700 font-semibold shadow-sm border border-rose-100"
                                : "text-slate-600 hover:bg-slate-100 border border-transparent"
                                }`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <span>{lang.label}</span>
                            {currentLang === lang.code && loading && (
                                <Loader2 className="w-4 h-4 ml-auto animate-spin text-rose-400" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Export actions */}
                <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50/80">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">
                        Xuất file JSON
                    </p>
                    {LANGS.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleExport(lang.code)}
                            className="w-full flex items-center gap-2 text-slate-600 text-sm px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition"
                        >
                            <Download className="w-4 h-4 shrink-0 text-slate-400" />
                            <span>{lang.flag} {lang.label}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-wrap gap-3 justify-between items-center shadow-sm shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base md:text-lg font-bold text-slate-800">
                                    {LANGS.find((l) => l.code === currentLang)?.flag}{" "}
                                    {LANGS.find((l) => l.code === currentLang)?.label}
                                </h2>
                                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                                    /i18n/{currentLang}
                                </span>
                                {dirtyCount > 0 && (
                                    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                        {dirtyCount} chưa lưu
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400">
                                {Object.values(sections).reduce((a, s) => a + Object.keys(s).length, 0)} keys
                                trong {Object.keys(sections).length} sections
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 sm:flex-none sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm key, giá trị..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={() => loadLocale(currentLang)}
                            disabled={loading}
                            className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                            title="Tải lại"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>

                        {/* Import JSON */}
                        <button
                            onClick={() => { setShowImport(true); setImportError(null); }}
                            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-semibold transition shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Nhập JSON</span>
                        </button>

                        {/* Save all */}
                        <button
                            onClick={saveAllDirty}
                            disabled={dirtyCount === 0}
                            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Lưu tất cả</span>
                            {dirtyCount > 0 && (
                                <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {dirtyCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Error banner */}
                {globalError && (
                    <div className="mx-4 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{globalError}</span>
                        <button
                            onClick={() => setGlobalError(null)}
                            className="ml-auto text-red-400 hover:text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Editor area ── */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-4xl mx-auto space-y-4 pb-16">

                        {loading && Object.keys(sections).length === 0 && (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                            </div>
                        )}

                        {Object.entries(filteredSections).map(([section, keys]) => {
                            const isCollapsed = collapsedSections[section];
                            const keyCount = Object.keys(keys).length;
                            const sectionDirtyCount = Object.values(dirtyKeys[section] || {}).filter(Boolean).length;

                            return (
                                <div
                                    key={section}
                                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Section header */}
                                    <div className="bg-slate-50/80 px-4 md:px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <button
                                            onClick={() =>
                                                setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }))
                                            }
                                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                                        >
                                            {isCollapsed ? (
                                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                            )}
                                            <h3 className="font-bold text-slate-800 font-mono text-sm md:text-base break-all">
                                                {section === "__root__" ? "(root keys)" : section}
                                            </h3>
                                            <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                                                {keyCount} keys
                                            </span>
                                            {sectionDirtyCount > 0 && (
                                                <span className="text-xs bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 font-semibold">
                                                    {sectionDirtyCount} pending
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSection(section)}
                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition shrink-0 ml-2"
                                            title="Xóa section"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Keys list */}
                                    {!isCollapsed && (
                                        <div className="p-4 md:p-5 space-y-4">
                                            {Object.entries(keys).map(([subKey, value]) => {
                                                const fullKey = section === "__root__" ? subKey : `${section}.${subKey}`;
                                                const isDirty = dirtyKeys[section]?.[subKey];
                                                const isSaving = savingKeys[fullKey];
                                                const isEmpty = !value || value.trim() === "";

                                                return (
                                                    <div
                                                        key={subKey}
                                                        className="flex flex-col md:flex-row gap-2 md:gap-4 items-start group"
                                                    >
                                                        {/* Key label */}
                                                        <div className="w-full md:w-[30%] md:pt-3 flex items-center justify-between gap-2">
                                                            <label className="text-xs font-semibold text-slate-600 font-mono bg-slate-100 px-2 py-1.5 rounded-md border border-slate-200 break-all">
                                                                {subKey}
                                                            </label>
                                                            <button
                                                                onClick={() => handleDeleteKey(section, subKey)}
                                                                className="text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition p-1.5 shrink-0"
                                                                title="Xóa key"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Value input */}
                                                        <div className="flex-1 w-full flex gap-2 items-start">
                                                            <div className="flex-1 relative">
                                                                {value && value.length > 60 ? (
                                                                    <textarea
                                                                        value={value}
                                                                        onChange={(e) => updateLocalValue(section, subKey, e.target.value)}
                                                                        className={`w-full p-3 border rounded-xl text-sm text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition min-h-[96px]
                                      ${isDirty ? "border-amber-300 bg-amber-50/30" : "border-slate-200"}`}
                                                                        placeholder="Nhập nội dung..."
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={value}
                                                                        onChange={(e) => updateLocalValue(section, subKey, e.target.value)}
                                                                        className={`w-full p-3 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition
                                      ${isDirty ? "border-amber-300 bg-amber-50/30" : "border-slate-200"}`}
                                                                        placeholder="Nhập nội dung..."
                                                                    />
                                                                )}
                                                                {isEmpty && (
                                                                    <span className="absolute right-2.5 top-2.5 text-[10px] text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                                        trống
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Per-key save button */}
                                                            {isDirty && (
                                                                <button
                                                                    onClick={() => saveKey(section, subKey)}
                                                                    disabled={isSaving}
                                                                    className="mt-0.5 p-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition shrink-0"
                                                                    title="Lưu key này"
                                                                >
                                                                    {isSaving ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <Save className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Add new key */}
                                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center pt-4 border-t border-slate-100 mt-2">
                                                <input
                                                    placeholder="Thêm key mới (vd: new_title)"
                                                    value={newKeyInput.section === section ? newKeyInput.value : ""}
                                                    onChange={(e) => setNewKeyInput({ section, value: e.target.value })}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddKey(section)}
                                                    className="p-2.5 text-sm border border-slate-200 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-slate-300 font-mono"
                                                />
                                                <button
                                                    onClick={() => handleAddKey(section)}
                                                    disabled={!newKeyInput.value || newKeyInput.section !== section}
                                                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition shrink-0 w-full sm:w-auto"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Thêm key
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* No results */}
                        {searchQuery && Object.keys(filteredSections).length === 0 && (
                            <div className="text-center py-16 text-slate-400">
                                <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">Không tìm thấy key nào</p>
                                <p className="text-sm mt-1">Thử tìm kiếm từ khác</p>
                            </div>
                        )}

                        {/* Add new section */}
                        <div className="pt-2 pb-12">
                            {isAddingSection ? (
                                <div className="bg-white border-2 border-dashed border-rose-300 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                    <input
                                        autoFocus
                                        placeholder="Tên section mới (vd: checkout)"
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                                        className="p-3 text-sm border border-slate-200 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-rose-300 font-mono"
                                    />
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={handleAddSection}
                                            disabled={!newSectionName.trim()}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl hover:bg-rose-700 disabled:opacity-40 text-sm font-bold transition"
                                        >
                                            Thêm
                                        </button>
                                        <button
                                            onClick={() => setIsAddingSection(false)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-200 text-sm font-bold transition"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingSection(true)}
                                    className="w-full py-5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 flex items-center justify-center gap-2 font-semibold transition-all text-sm"
                                >
                                    <FolderPlus className="w-5 h-5" />
                                    Thêm section mới
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Import Modal */}
            <ImportModal
                showImport={showImport}
                setShowImport={setShowImport}
                importTab={importTab}
                setImportTab={setImportTab}
                importLocale={importLocale}
                setImportLocale={setImportLocale}
                importText={importText}
                setImportText={setImportText}
                importError={importError}
                setImportError={setImportError}
                importing={importing}
                handleFileUpload={handleFileUpload}
                handleImport={handleImport}
                parseImportText={parseImportText}
                countFlatKeys={countFlatKeys}
                fileInputRef={fileInputRef}
            />
        </div>
    );
}

// ─── Import JSON Modal ───
function ImportModal({
    showImport, setShowImport, importTab, setImportTab, importLocale, setImportLocale,
    importText, setImportText, importError, setImportError, importing, handleFileUpload,
    handleImport, parseImportText, countFlatKeys, fileInputRef
}: any) {
    if (!showImport) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => { setShowImport(false); setImportText(""); }}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Modal header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                            <FileJson className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Nhập JSON</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Bulk import từ file .json</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowImport(false); setImportText(""); }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Options row */}
                <div className="px-5 pt-4 flex flex-wrap gap-4 items-center">
                    {/* Locale selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Import vào</label>
                        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
                            {([["all", "🌐 Tất cả"], ["vi", "🇻🇳 VI"], ["en", "🇺🇸 EN"], ["ja", "🇯🇵 JA"]] as const).map(([code, label]) => (
                                <button
                                    key={code}
                                    onClick={() => setImportLocale(code as Locale | "all")}
                                    className={`px-3 py-1.5 font-medium transition ${importLocale === code
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab */}
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm ml-auto">
                        <button
                            onClick={() => setImportTab("paste")}
                            className={`px-3 py-1.5 font-medium transition ${importTab === "paste" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Paste JSON
                        </button>
                        <button
                            onClick={() => { setImportTab("file"); fileInputRef.current?.click(); }}
                            className={`px-3 py-1.5 font-medium transition ${importTab === "file" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Tải file
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>

                {/* Textarea */}
                <div className="px-5 py-3 flex-1 min-h-0 flex flex-col gap-2">
                    <textarea
                        value={importText}
                        onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
                        placeholder={`{\n  "home": {\n    "welcome": "Chào mừng"\n  }\n}`}
                        spellCheck={false}
                        className={`w-full flex-1 min-h-[220px] p-4 font-mono text-sm border rounded-xl text-slate-700 resize-none focus:outline-none focus:ring-2 focus:border-slate-400 leading-relaxed
                  ${importError ? "border-red-300 focus:ring-red-200 bg-red-50/30" : "border-slate-200 focus:ring-slate-300"}`}
                    />

                    {/* Error */}
                    {importError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {importError}
                        </div>
                    )}

                    {/* Preview */}
                    {importText && !importError && (
                        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${parseImportText(importText)
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                            }`}>
                            {parseImportText(importText) ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>JSON hợp lệ — sẽ import <strong>{countFlatKeys(parseImportText(importText)!)} keys</strong> vào{" "}
                                        {importLocale === "all" ? "vi, en, ja" : importLocale}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>JSON chưa hợp lệ</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={() => { setShowImport(false); setImportText(""); }}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!parseImportText(importText) || importing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                        {importing ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang import...</>
                        ) : (
                            <><Upload className="w-4 h-4" /> Import</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
