"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Clock,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { MapsLocationCompany } from "@/components/location-company-maps";
import { toast } from "sonner";
import useTranslations from "@/i18n/useTranslations";

const MAX_MESSAGE_LENGTH = 1000;

export default function ContactPage() {
  const t = useTranslations();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    requestType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSubmitted(true);
        toast.success(t("contact.toast_success") || "Gửi tin nhắn thành công!");
        setTimeout(() => {
          setFormData({ name: "", email: "", phone: "", requestType: "", message: "" });
          setIsSubmitted(false);
        }, 4000);
      } else {
        toast.error(t("contact.toast_error") || "Gửi thất bại. Vui lòng thử lại.");
      }
    } catch {
      toast.error(t("contact.toast_error") || "Gửi thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: t("contact.info_address_title") || "Địa chỉ",
      content: t("contact.info_address_content") || "Thôn Tú Y, xã Hà Đông, Thành Phố Hải Phòng",
      link: "https://maps.app.goo.gl/tKcvMmRWo9zHdDAR7",
      linkLabel: t("contact.info_view_map") || "Xem bản đồ →",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderHover: "hover:border-blue-300",
    },
    {
      icon: Phone,
      title: t("contact.info_phone_title") || "Điện thoại",
      content: t("contact.info_phone_content") || "(+84) 0962-215-666",
      link: "tel:+840962215666",
      linkLabel: null,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderHover: "hover:border-green-300",
    },
    {
      icon: Mail,
      title: t("contact.info_email_title") || "Email",
      content: t("contact.info_email_content") || "info@lalalycheee.vn",
      link: "mailto:info@lalalycheee.vn",
      linkLabel: null,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderHover: "hover:border-purple-300",
    },
    {
      icon: Clock,
      title: t("contact.info_hours_title") || "Giờ làm việc",
      content: t("contact.info_hours_content") || "Thứ 2 - Chủ nhật: 8:00 - 20:00",
      link: null,
      linkLabel: null,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderHover: "",
    },
  ];

  const requestTypes = [
    { value: "product", label: t("contact.request_product") || "Hỏi về sản phẩm" },
    { value: "wholesale", label: t("contact.request_wholesale") || "Đặt hàng sỉ / Hợp tác" },
    { value: "order", label: t("contact.request_order") || "Theo dõi đơn hàng" },
    { value: "complaint", label: t("contact.request_complaint") || "Khiếu nại / Phản hồi" },
    { value: "other", label: t("contact.request_other") || "Khác" },
  ];

  const faqs = [
    { q: t("contact.faq_q1") || "Giao hàng mất bao lâu?", a: t("contact.faq_a1") || "" },
    { q: t("contact.faq_q2") || "Có bán sỉ không?", a: t("contact.faq_a2") || "" },
    { q: t("contact.faq_q3") || "Sản phẩm có được kiểm định chất lượng không?", a: t("contact.faq_a3") || "" },
    { q: t("contact.faq_q4") || "Chính sách đổi trả hàng như thế nào?", a: t("contact.faq_a4") || "" },
  ];

  const trustBadges = [
    t("contact.badge_response") || "⚡ Phản hồi trong 30 phút",
    t("contact.badge_customers") || "✅ 500+ khách hàng tin tưởng",
    t("contact.badge_support") || "🕐 Hỗ trợ 8:00–20:00 hàng ngày",
  ];

  const charsRemaining = MAX_MESSAGE_LENGTH - formData.message.length;
  const isNearLimit = charsRemaining <= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Richer gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-purple-600/10 to-pink-500/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-300/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl inline-block shadow-lg shadow-blue-500/30">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              {t("contact.hero_title") || "Liên hệ với chúng tôi"}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              {t("contact.hero_subtitle") ||
                "Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn."}
            </p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-3"
            >
              {trustBadges.map((badge, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact Info Cards ───────────────────────────── */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            const cardContent = (
              <div
                className={`bg-white rounded-2xl p-6 shadow-lg h-full border border-gray-100 transition-all duration-300 ${
                  info.link
                    ? `hover:shadow-xl ${info.borderHover} group cursor-pointer`
                    : ""
                }`}
              >
                <div
                  className={`${info.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 ${
                    info.link ? "group-hover:scale-110" : ""
                  }`}
                >
                  <Icon className={`w-7 h-7 ${info.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{info.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{info.content}</p>
                {info.linkLabel && (
                  <p
                    className={`mt-3 text-sm font-semibold ${info.color} flex items-center gap-1 group-hover:gap-2 transition-all duration-200`}
                  >
                    {info.linkLabel}
                  </p>
                )}
                {info.link && !info.linkLabel && (
                  <ArrowRight
                    className={`w-4 h-4 mt-3 ${info.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                  />
                )}
              </div>
            );

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="h-full"
              >
                {info.link ? (
                  <a
                    href={info.link}
                    target={info.link.startsWith("http") ? "_blank" : "_self"}
                    rel={info.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block h-full"
                  >
                    {cardContent}
                  </a>
                ) : (
                  cardContent
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Form + Map Section ───────────────────────────── */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {t("contact.form_title") || "Gửi tin nhắn cho chúng tôi"}
                </h2>
                <p className="text-gray-600">
                  {t("contact.form_subtitle") ||
                    "Điền thông tin bên dưới và chúng tôi sẽ phản hồi trong vòng 30 phút."}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: 2, duration: 0.4 }}
                    >
                      <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("contact.success_title") || "Gửi thành công!"}
                    </h3>
                    <p className="text-gray-600">
                      {t("contact.success_message") ||
                        "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể."}
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-semibold">
                          {t("contact.field_name") || "Họ và tên *"}
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={t("contact.field_name_placeholder") || "Nhập họ và tên"}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-semibold">
                          {t("contact.field_phone") || "Số điện thoại *"}
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={t("contact.field_phone_placeholder") || "Nhập số điện thoại"}
                          className="h-12"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">
                        {t("contact.field_email") || "Email *"}
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("contact.field_email_placeholder") || "example@email.com"}
                        className="h-12"
                      />
                    </div>

                    {/* Request Type Dropdown — replaces Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="requestType" className="text-gray-700 font-semibold">
                        {t("contact.field_request_type") || "Loại yêu cầu *"}
                      </Label>
                      <div className="relative">
                        <select
                          id="requestType"
                          name="requestType"
                          required
                          value={formData.requestType}
                          onChange={handleChange}
                          className="w-full h-12 px-3 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            {t("contact.field_request_placeholder") || "Chọn loại yêu cầu"}
                          </option>
                          {requestTypes.map((rt) => (
                            <option key={rt.value} value={rt.value}>
                              {rt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Message + Character Counter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="message" className="text-gray-700 font-semibold">
                          {t("contact.field_message") || "Nội dung tin nhắn *"}
                        </Label>
                        <span
                          className={`text-xs tabular-nums transition-colors duration-200 ${
                            isNearLimit ? "text-orange-500 font-semibold" : "text-gray-400"
                          }`}
                        >
                          {charsRemaining} {t("contact.char_remaining") || "ký tự còn lại"}
                        </span>
                      </div>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={
                          t("contact.field_message_placeholder") ||
                          "Nhập nội dung tin nhắn của bạn..."
                        }
                        rows={6}
                        className="resize-none"
                        maxLength={MAX_MESSAGE_LENGTH}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          {t("contact.submitting") || "Đang gửi..."}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {t("contact.submit_button") || "Gửi tin nhắn"}
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:sticky lg:top-8 h-fit"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <MapsLocationCompany />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────── */}
      <section className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {t("contact.faq_title") || "Câu hỏi thường gặp"}
            </h2>
            <p className="text-gray-600 text-lg">
              {t("contact.faq_subtitle") ||
                "Những thắc mắc phổ biến nhất từ khách hàng"}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl relative overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("contact.cta_title") || "Chúng tôi luôn sẵn sàng hỗ trợ bạn"}
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {t("contact.cta_subtitle") ||
                "Đội ngũ của chúng tôi phản hồi trong vòng 30 phút trong giờ làm việc."}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:+840962215666"
                id="contact-cta-call"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-300 shadow-md"
              >
                <Phone className="w-5 h-5" />
                {t("contact.cta_call") || "Gọi ngay"}
              </a>
              <a
                href="https://zalo.me/0962215666"
                id="contact-cta-zalo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/20 border border-white/40 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/30 transition-colors duration-300"
              >
                <MessageSquare className="w-5 h-5" />
                {t("contact.cta_zalo") || "Chat Zalo"}
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
