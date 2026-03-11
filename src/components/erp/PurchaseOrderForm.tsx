"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ShoppingCart, Building2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { createPO } from "@/apiRequests/purchase";

// ─── Schema ───────────────────────────────────────────────────────────────────

const lineSchema = z.object({
    itemId: z.string().min(1, "Chọn mặt hàng"),
    description: z.string().optional(),
    qty: z.coerce.number().positive("SL > 0"),
    unitPriceCents: z.coerce.number().nonnegative("Giá >= 0"),
    uomId: z.string().min(1, "Chọn ĐVT"),
    promisedDate: z.string().optional(),
});

const poSchema = z.object({
    vendorId: z.string().min(1, "Chọn nhà cung cấp"),
    currency: z.string().optional(),
    paymentTermsDays: z.coerce.number().int().nonnegative().optional(),
    expectedDeliveryDate: z.string().optional(),
    note: z.string().optional(),
    lines: z.array(lineSchema).min(1, "Phải có ít nhất 1 dòng hàng"),
});

type POFormValues = z.infer<typeof poSchema>;

interface PurchaseOrderFormProps {
    vendors: Array<{ _id: string; name: string; code: string; currency: string; paymentTermsDays: number }>;
    items: Array<{ _id: string; name: string; sku?: string; unit: string }>;
    uoms: Array<{ _id: string; code: string; name: string }>;
    onSuccess: (poId: string) => void;
    onCancel: () => void;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = ["Nhà cung cấp", "Dòng hàng", "Xem lại"] as const;

export function PurchaseOrderForm({ vendors, items, uoms, onSuccess, onCancel }: PurchaseOrderFormProps) {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<POFormValues>({
        resolver: zodResolver(poSchema),
        defaultValues: {
            vendorId: "",
            currency: "VND",
            paymentTermsDays: 30,
            lines: [{ itemId: "", qty: 1, unitPriceCents: 0, uomId: "", description: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });

    const selectedVendor = vendors.find((v) => v._id === form.watch("vendorId"));

    // Auto-fill vendor defaults when vendor changes
    const handleVendorChange = (vendorId: string) => {
        const vendor = vendors.find((v) => v._id === vendorId);
        if (vendor) {
            form.setValue("currency", vendor.currency);
            form.setValue("paymentTermsDays", vendor.paymentTermsDays);
        }
    };

    const nextStep = async () => {
        if (step === 0) {
            const valid = await form.trigger(["vendorId", "currency", "paymentTermsDays"]);
            if (valid) setStep(1);
        } else if (step === 1) {
            const valid = await form.trigger("lines");
            if (valid) setStep(2);
        }
    };

    const prevStep = () => setStep((s) => Math.max(0, s - 1));

    const onSubmit = async (values: POFormValues) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const result = await createPO(values);
            if (result.success) {
                onSuccess((result.data as { _id: string })._id);
            }
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Lỗi tạo PO");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalCents = form.watch("lines").reduce((s, l) => s + (l.qty || 0) * (l.unitPriceCents || 0), 0);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                    Tạo đơn mua hàng (PO)
                </h2>
                {/* Progress steps */}
                <div className="flex items-center gap-1">
                    {STEPS.map((label, i) => (
                        <React.Fragment key={i}>
                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${i === step ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : i < step ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"}`}>
                                {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                                {label}
                            </div>
                            {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="p-5 space-y-4 min-h-[320px]">

                    {/* Step 0: Vendor */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Nhà cung cấp <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="vendorId"
                                    control={form.control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            onChange={(e) => { field.onChange(e); handleVendorChange(e.target.value); }}
                                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">— Chọn nhà cung cấp —</option>
                                            {vendors.map((v) => (
                                                <option key={v._id} value={v._id}>{v.code} – {v.name}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                                {form.formState.errors.vendorId && (
                                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.vendorId.message}</p>
                                )}
                                {selectedVendor && (
                                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>{selectedVendor.name} · Tiền tệ: {selectedVendor.currency} · Thanh toán: {selectedVendor.paymentTermsDays} ngày</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ngày giao hàng dự kiến</label>
                                    <input type="date" {...form.register("expectedDeliveryDate")} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Điều khoản thanh toán (ngày)</label>
                                    <input type="number" {...form.register("paymentTermsDays")} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú</label>
                                <textarea rows={2} {...form.register("note")} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>
                        </div>
                    )}

                    {/* Step 1: Lines */}
                    {step === 1 && (
                        <div className="space-y-3">
                            {fields.map((field, idx) => (
                                <div key={field.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dòng #{idx + 1}</span>
                                        <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="col-span-2">
                                            <select {...form.register(`lines.${idx}.itemId`)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">— Chọn mặt hàng —</option>
                                                {items.map((item) => (
                                                    <option key={item._id} value={item._id}>{item.sku ? `[${item.sku}] ` : ""}{item.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <input type="number" step="0.001" placeholder="Số lượng" {...form.register(`lines.${idx}.qty`)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <select {...form.register(`lines.${idx}.uomId`)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">ĐVT</option>
                                                {uoms.map((u) => <option key={u._id} value={u._id}>{u.code} – {u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" step="1" placeholder="Đơn giá (VND cents, e.g. 100000 = 1.000 đ)" {...form.register(`lines.${idx}.unitPriceCents`)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => append({ itemId: "", qty: 1, unitPriceCents: 0, uomId: "", description: "" })}
                                className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Thêm dòng hàng
                            </button>
                        </div>
                    )}

                    {/* Step 2: Review */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nhà cung cấp</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{selectedVendor?.name ?? "—"}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng giá trị</p>
                                    <p className="font-bold text-blue-700 dark:text-blue-300">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalCents / 100)}</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-semibold text-slate-500 dark:text-slate-400">Mặt hàng</th>
                                            <th className="py-2 px-3 text-right font-semibold text-slate-500 dark:text-slate-400">SL</th>
                                            <th className="py-2 px-3 text-right font-semibold text-slate-500 dark:text-slate-400">Đơn giá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.watch("lines").map((line, i) => {
                                            const item = items.find((it) => it._id === line.itemId);
                                            return (
                                                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                                                    <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">{item?.name ?? line.itemId}</td>
                                                    <td className="py-1.5 px-3 text-right text-slate-600 dark:text-slate-400">{line.qty}</td>
                                                    <td className="py-1.5 px-3 text-right text-slate-600 dark:text-slate-400">{(line.unitPriceCents / 100).toLocaleString("vi-VN")}đ</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {submitError && (
                                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{submitError}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={step === 0 ? onCancel : prevStep} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" />
                        {step === 0 ? "Huỷ" : "Quay lại"}
                    </button>
                    {step < 2 ? (
                        <button type="button" onClick={nextStep} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
                            Tiếp theo <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2">
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            Tạo đơn hàng
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
