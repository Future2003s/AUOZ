"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PhoneCall, Mail, Shield } from "lucide-react";
import { ComplaintSettings } from "@/types/complaints";

interface ComplaintForm {
  fullName: string;
  orderCode: string;
  email: string;
  phone: string;
  title: string;
  description: string;
}

const initialForm: ComplaintForm = {
  fullName: "",
  orderCode: "",
  email: "",
  phone: "",
  title: "",
  description: "",
};

interface ComplaintsPageClientProps {
  settings: ComplaintSettings;
}

export function ComplaintsPageClient({ settings }: ComplaintsPageClientProps) {
  const [formData, setFormData] = useState<ComplaintForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData(initialForm);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <p className="text-sm uppercase tracking-widest text-rose-500 mb-3">
            Giải Quyết Khiếu Nại
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">
            {settings.heroTitle}
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {settings.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-6xl grid gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                {settings.processTitle}
              </h2>
              <p className="text-slate-600">{settings.processDescription}</p>
            </div>
            <div className="space-y-4">
              {settings.steps.map((step, idx) => (
                <div
                  key={`${step.title}-${idx}`}
                  className="flex items-start gap-3 bg-rose-50/70 py-3 px-4 rounded-2xl border border-rose-100"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-rose-500 font-semibold flex items-center justify-center shadow-sm">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{step.title}</p>
                    {step.description && (
                      <p className="text-slate-600 text-sm">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-2xl p-4 bg-white shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                  <PhoneCall className="w-4 h-4" />
                  {settings.hotlineLabel}
                </div>
                <Link
                  href={`tel:${settings.hotlineNumber.replace(/\D/g, "")}`}
                  className="text-xl font-semibold text-slate-900 hover:text-rose-600"
                >
                  {settings.hotlineNumber}
                </Link>
                <p className="text-xs text-slate-500">{settings.hotlineHours}</p>
              </div>
              <div className="border rounded-2xl p-4 bg-white shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                  <Mail className="w-4 h-4" />
                  Email hỗ trợ
                </div>
                <Link
                  href={`mailto:${settings.email}`}
                  className="text-sm font-semibold text-slate-900 hover:text-rose-600"
                >
                  {settings.email}
                </Link>
                <p className="text-xs text-slate-500">{settings.emailNote}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
              <Shield className="w-10 h-10 text-green-600" />
              <div className="text-sm text-slate-600 text-left">
                {settings.guaranteeText}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              Gửi yêu cầu khiếu nại
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Điền thông tin dưới đây, chúng tôi sẽ liên hệ trong thời gian sớm nhất.
            </p>
            {isSubmitted ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">
                  Đã gửi khiếu nại thành công!
                </h4>
                <p className="text-slate-600">
                  Chúng tôi đã ghi nhận thông tin và sẽ phản hồi trong vòng 24h.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Họ và tên *</label>
                    <Input
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mã đơn hàng *</label>
                    <Input
                      name="orderCode"
                      required
                      value={formData.orderCode}
                      onChange={handleChange}
                      placeholder="VD: LALA-2024-0001"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+84..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiêu đề *</label>
                  <Input
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Mô tả ngắn vấn đề"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nội dung chi tiết *</label>
                  <Textarea
                    name="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Vui lòng mô tả chi tiết vấn đề, thời gian, sản phẩm liên quan..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold bg-rose-500 hover:bg-rose-600"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi khiếu nại"}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Bằng việc gửi yêu cầu, bạn đồng ý với{" "}
                  <Link href="/vi/policy" className="text-rose-500 underline">
                    chính sách bảo mật
                  </Link>{" "}
                  của chúng tôi.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


