"use client";
import React, { useEffect, useState } from "react";
import { promoWidgetApi, PromoWidget } from "@/apiRequests/promoWidgets";
import { Plus, Edit, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminPromosPage() {
    const [widgets, setWidgets] = useState<PromoWidget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState<Partial<PromoWidget>>({
        title: "", description: "", link: "",
        position: "left_ad", isActive: true,
    });

    const fetchData = async () => {
        try {
            const res = await promoWidgetApi.getAll();
            if (res.success) setWidgets(res.data);
        } catch {
            toast.error("Failed to load widgets");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append("file", e.target.files[0]);
        try {
            const res = await fetch("/api/uploads", { method: "POST", body: fd });
            const data = await res.json();
            if (data?.data?.url) {
                setFormData({ ...formData, imageUrl: data.data.url });
                toast.success("Tải ảnh lên thành công!");
            }
        } catch {
            toast.error("Tải ảnh lên thất bại");
        } finally {
            setUploadingImage(false);
        }
    }

    const handleSubmit = async () => {
        try {
            if (formData._id) {
                await promoWidgetApi.update(formData._id, formData);
                toast.success("Cập nhật thành công!");
            } else {
                await promoWidgetApi.create(formData);
                toast.success("Tạo mới thành công!");
            }
            setIsModalOpen(false);
            fetchData();
        } catch {
            toast.error("Lưu dữ liệu thất bại");
        }
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await promoWidgetApi.toggleActive(id);
            toast.success(currentStatus ? 'Đã tắt quảng cáo' : 'Đã bật quảng cáo');
            fetchData();
        } catch { toast.error("Đổi trạng thái thất bại"); }
    }

    const deleteWidget = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xoá quảng cáo này?")) return;
        try {
            await promoWidgetApi.delete(id);
            toast.success("Đã xoá quảng cáo");
            fetchData();
        } catch { toast.error("Xoá thất bại"); }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sidebar Quảng Cáo</h1>
                    <p className="text-gray-500 text-sm mt-1">Thêm/sửa và bật tắt các Banner quảng cáo mới ở trang Sản Phẩm</p>
                </div>
                <button onClick={() => { setFormData({ title: "", description: "", imageUrl: "", position: 'left_ad', isActive: true }); setIsModalOpen(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm font-semibold text-sm">
                    <Plus size={18} strokeWidth={2.5} /> Thêm Widget Mới
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : widgets.length === 0 ? (
                    <p className="text-center p-8 text-gray-500">Chưa có Widget quảng cáo nào.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">Ảnh Minh Hoạ</th>
                                    <th className="p-4 font-semibold text-gray-600">Tiêu đề hiển thị</th>
                                    <th className="p-4 font-semibold text-gray-600">Vị trí (Trái/Phải)</th>
                                    <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                                    <th className="p-4 font-semibold text-gray-600 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {widgets.map(w => (
                                    <tr key={w._id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                                        <td className="p-4">
                                            {w.imageUrl ? (
                                                <div className="h-14 w-20 rounded-md overflow-hidden ring-1 ring-gray-200">
                                                    <img src={w.imageUrl} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="h-14 w-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">No Img</div>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-gray-800 max-w-[200px] truncate" title={w.title}>{w.title}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-50/80 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md font-bold text-xs uppercase tracking-wider">
                                                {w.position}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => toggleActive(w._id!, w.isActive)} className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize tracking-wider transition ${w.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                {w.isActive ? "Đang Bật" : "Đang Tắt"}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={() => { setFormData(w); setIsModalOpen(true); }} className="text-slate-600 hover:bg-slate-100 hover:text-blue-600 p-2 rounded-full transition" title="Sửa"><Edit size={16} /></button>
                                                <button onClick={() => deleteWidget(w._id!)} className="text-slate-600 hover:bg-slate-100 hover:text-red-600 p-2 rounded-full transition" title="Xoá"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center overflow-auto p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">{formData._id ? "Sửa Promo Widget" : "Thêm Promo Widget Mới"}</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Tiêu đề (Bắt buộc)</label>
                                <input className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 bg-gray-50/50 outline-none transition" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Sản phẩm nổi bật / Tiêu đề câu chuyện..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Mô tả ngắn</label>
                                <textarea rows={3} className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 bg-gray-50/50 outline-none transition" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Được chắt lọc từ những giọt mật tinh tuý nhất... " />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Đường dẫn liên kết URL (Tuỳ chọn click)</label>
                                <input className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 bg-gray-50/50 outline-none transition" value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="/vi/products/mat-ong-vai-thieu" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Vị trí hiển thị</label>
                                    <select className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 bg-gray-50/50 outline-none transition font-medium" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value as any })}>
                                        <option value="left_ad">Ad Banner (Bên Trái)</option>
                                        <option value="right_upcoming">Sắp ra mắt (Bên Phải)</option>
                                        <option value="right_story">Câu chuyện sinh thái (Bên Phải)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Hiển thị Banner?</label>
                                    <select className="w-full border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 bg-gray-50/50 outline-none transition font-medium" value={formData.isActive ? "true" : "false"} onChange={e => setFormData({ ...formData, isActive: e.target.value === "true" })}>
                                        <option value="true">Đang Bật (Hiển thị ngay)</option>
                                        <option value="false">Đang Tắt (Tạm ẩn)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Hình ảnh</label>
                                <div className="flex gap-4 items-end">
                                    {formData.imageUrl && (
                                        <div className="relative h-24 w-32 rounded-xl overflow-hidden ring-1 ring-gray-200">
                                            <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 relative">
                                        <input type="file" id="cover-upload" onChange={handleUpload} className="hidden" />
                                        <label htmlFor="cover-upload" className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-5 px-4 cursor-pointer hover:bg-gray-50 hover:border-emerald-400 transition group">
                                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-600">{uploadingImage ? "Đang tải lên server..." : "Nhấn để Upload ảnh từ máy"}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Huỷ bỏ</button>
                                <button onClick={handleSubmit} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition hover:-translate-y-0.5" disabled={!formData.title}>
                                    {formData._id ? "Lưu Thay Đổi Sửa Đổi" : "Tạo Mới Hoàn Tất"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
