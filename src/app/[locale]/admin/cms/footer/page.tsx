"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Save,
  Eye,
  Loader2,
  Plus,
  Trash2,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Building2,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

interface FooterLink {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
}

interface SocialMedia {
  platform: string;
  url: string;
  enabled: boolean;
}

interface FooterSettings {
  company: {
    name: string;
    description: string;
    logo?: string;
  };
  contact: {
    address: string;
    addressLink?: string;
    email: string;
    phone: string;
  };
  quickLinks: FooterLink[];
  socialMedia: SocialMedia[];
  companyInfo: {
    companyName: string;
    taxCode: string;
    managedBy: string;
  };
  copyright: string;
  certifications: {
    dmcaUrl?: string;
    dmcaId?: string;
    showAnToan?: boolean;
    showTgBct?: boolean;
  };
}

const defaultFooterSettings: FooterSettings = {
  company: {
    name: "Lalalycheee",
    description: "Chúng tôi tự hào mang đến những sản phẩm vải thiều chất lượng cao, bền vững và thân thiện môi trường, góp phần nâng tầm giá trị nông sản Việt.",
  },
  contact: {
    address: "thôn Tú Y, xã Hà Đông, Thành Phố Hải Phòng.",
    addressLink: "https://maps.app.goo.gl/tKcvMmRWo9zHdDAR7",
    email: "info@lalalycheee.vn",
    phone: "(+84) 0962-215-666",
  },
  quickLinks: [
    { id: "1", label: "Trang chủ", href: "/vi", order: 1, visible: true },
    { id: "2", label: "Sản phẩm", href: "/vi/products", order: 2, visible: true },
    { id: "3", label: "Liên hệ", href: "/vi/contact", order: 3, visible: true },
    { id: "4", label: "Tin tức & Sự kiện", href: "/vi/news", order: 4, visible: true },
    { id: "5", label: "Giải quyết khiếu nại", href: "/vi/complaints", order: 5, visible: true },
  ],
  socialMedia: [
    { platform: "instagram", url: "https://www.instagram.com/lala_lycheee?igsh=M2x5cmgwdmZrcDh1&utm_source=qr", enabled: true },
    { platform: "facebook", url: "", enabled: false },
    { platform: "twitter", url: "", enabled: false },
    { platform: "youtube", url: "", enabled: false },
  ],
  companyInfo: {
    companyName: "CÔNG TY TNHH LALA - LYCHEEE",
    taxCode: "0801381660",
    managedBy: "Quản Lý Bởi Thanh Hà - Thuế cơ sở 14 Thành Phố Hải Phòng",
  },
  copyright: `© ${new Date().getFullYear()} Lalalycheee CO.,LTD. Bảo lưu mọi quyền.`,
  certifications: {
    dmcaUrl: "https://www.dmca.com/Protection/Status.aspx?ID=750e685b-0b4b-48fa-bcc5-d198a3f3bd73&refurl=https://lalalycheee.vn/",
    dmcaId: "750e685b-0b4b-48fa-bcc5-d198a3f3bd73",
    showAnToan: true,
    showTgBct: true,
  },
};

export default function FooterSettingsPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [footer, setFooter] = useState<FooterSettings>(defaultFooterSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const res = await fetch("/api/cms/footer", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          setFooter({ ...defaultFooterSettings, ...data.data });
        }
      }
    } catch (error) {
      console.error("Error fetching footer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(footer),
      });

      if (res.ok) {
        toast.success("Đã lưu cấu hình footer thành công!", {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        });
        setHasChanges(false);
      } else {
        toast.error("Không thể lưu cấu hình footer", {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        });
      }
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const addQuickLink = () => {
    const newLink: FooterLink = {
      id: `link-${Date.now()}`,
      label: "Link mới",
      href: "#",
      order: footer.quickLinks.length + 1,
      visible: true,
    };
    setFooter({
      ...footer,
      quickLinks: [...footer.quickLinks, newLink],
    });
    setHasChanges(true);
  };

  const removeQuickLink = (id: string) => {
    setFooter({
      ...footer,
      quickLinks: footer.quickLinks.filter((link) => link.id !== id),
    });
    setHasChanges(true);
  };

  const updateQuickLink = (id: string, updates: Partial<FooterLink>) => {
    setFooter({
      ...footer,
      quickLinks: footer.quickLinks.map((link) =>
        link.id === id ? { ...link, ...updates } : link
      ),
    });
    setHasChanges(true);
  };

  const updateSocialMedia = (platform: string, updates: Partial<SocialMedia>) => {
    setFooter({
      ...footer,
      socialMedia: footer.socialMedia.map((sm) =>
        sm.platform === platform ? { ...sm, ...updates } : sm
      ),
    });
    setHasChanges(true);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return Instagram;
      case "facebook":
        return Facebook;
      case "twitter":
        return Twitter;
      case "youtube":
        return Youtube;
      default:
        return LinkIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Footer</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý thông tin, links và cấu hình footer của website
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(`/${locale}`, "_blank")}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Xem trên website
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </Button>
        </div>
      </div>

      {/* Preview & Editor Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-1 space-y-4">

          <Tabs defaultValue="company" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company">Công Ty</TabsTrigger>
              <TabsTrigger value="contact">Liên Hệ</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="other">Khác</TabsTrigger>
            </TabsList>

        {/* Company Info */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Công Ty</CardTitle>
              <CardDescription>Cấu hình logo, tên và mô tả công ty</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên Công Ty</Label>
                <Input
                  value={footer.company.name}
                  onChange={(e) => {
                    setFooter({ ...footer, company: { ...footer.company, name: e.target.value } });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô Tả</Label>
                <Textarea
                  value={footer.company.description}
                  onChange={(e) => {
                    setFooter({ ...footer, company: { ...footer.company, description: e.target.value } });
                    setHasChanges(true);
                  }}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo (tùy chọn)</Label>
                <ImageUpload
                  value={footer.company.logo}
                  onChange={(url) => {
                    setFooter({ ...footer, company: { ...footer.company, logo: url } });
                    setHasChanges(true);
                  }}
                  label="Company Logo"
                  endpoint="/api/story/images"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Pháp Lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên Công Ty (Pháp Lý)</Label>
                <Input
                  value={footer.companyInfo.companyName}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      companyInfo: { ...footer.companyInfo, companyName: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Mã Số Thuế</Label>
                <Input
                  value={footer.companyInfo.taxCode}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      companyInfo: { ...footer.companyInfo, taxCode: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Quản Lý Bởi</Label>
                <Input
                  value={footer.companyInfo.managedBy}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      companyInfo: { ...footer.companyInfo, managedBy: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Liên Hệ</CardTitle>
              <CardDescription>Cấu hình địa chỉ, email và số điện thoại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Địa Chỉ</Label>
                <Input
                  value={footer.contact.address}
                  onChange={(e) => {
                    setFooter({ ...footer, contact: { ...footer.contact, address: e.target.value } });
                    setHasChanges(true);
                  }}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div className="space-y-2">
                <Label>Link Bản Đồ (Google Maps)</Label>
                <Input
                  type="url"
                  value={footer.contact.addressLink}
                  onChange={(e) => {
                    setFooter({ ...footer, contact: { ...footer.contact, addressLink: e.target.value } });
                    setHasChanges(true);
                  }}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={footer.contact.email}
                  onChange={(e) => {
                    setFooter({ ...footer, contact: { ...footer.contact, email: e.target.value } });
                    setHasChanges(true);
                  }}
                  placeholder="info@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Điện Thoại</Label>
                <Input
                  value={footer.contact.phone}
                  onChange={(e) => {
                    setFooter({ ...footer, contact: { ...footer.contact, phone: e.target.value } });
                    setHasChanges(true);
                  }}
                  placeholder="(+84) 0123-456-789"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Links */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liên Kết Nhanh</CardTitle>
                  <CardDescription>Quản lý các links trong footer</CardDescription>
                </div>
                <Button onClick={addQuickLink} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Thêm Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {footer.quickLinks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có links. Hãy thêm link mới.
                  </div>
                ) : (
                  footer.quickLinks
                    .sort((a, b) => a.order - b.order)
                    .map((link) => (
                      <Card key={link.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                  value={link.label}
                                  onChange={(e) =>
                                    updateQuickLink(link.id, { label: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={link.href}
                                  onChange={(e) =>
                                    updateQuickLink(link.id, { href: e.target.value })
                                  }
                                  placeholder="/vi/products"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={link.visible}
                                  onChange={(e) =>
                                    updateQuickLink(link.id, { visible: e.target.checked })
                                  }
                                  className="rounded"
                                />
                                <Label>Hiển thị</Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuickLink(link.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Cấu hình các liên kết mạng xã hội</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {footer.socialMedia.map((sm) => {
                const Icon = getSocialIcon(sm.platform);
                return (
                  <Card key={sm.platform} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <Label className="text-base font-semibold capitalize">
                                {sm.platform}
                              </Label>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={sm.enabled}
                              onChange={(e) =>
                                updateSocialMedia(sm.platform, { enabled: e.target.checked })
                              }
                              className="rounded"
                            />
                            <Label>Kích hoạt</Label>
                          </div>
                        </div>
                        {sm.enabled && (
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              type="url"
                              value={sm.url}
                              onChange={(e) =>
                                updateSocialMedia(sm.platform, { url: e.target.value })
                              }
                              placeholder={`https://${sm.platform}.com/...`}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Settings */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Copyright</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Copyright Text</Label>
                <Input
                  value={footer.copyright}
                  onChange={(e) => {
                    setFooter({ ...footer, copyright: e.target.value });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chứng Nhận & Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>DMCA URL</Label>
                <Input
                  type="url"
                  value={footer.certifications.dmcaUrl}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      certifications: { ...footer.certifications, dmcaUrl: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>DMCA ID</Label>
                <Input
                  value={footer.certifications.dmcaId}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      certifications: { ...footer.certifications, dmcaId: e.target.value },
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={footer.certifications.showAnToan}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      certifications: { ...footer.certifications, showAnToan: e.target.checked },
                    });
                    setHasChanges(true);
                  }}
                  className="rounded"
                />
                <Label>Hiển thị Badge An Toàn</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={footer.certifications.showTgBct}
                  onChange={(e) => {
                    setFooter({
                      ...footer,
                      certifications: { ...footer.certifications, showTgBct: e.target.checked },
                    });
                    setHasChanges(true);
                  }}
                  className="rounded"
                />
                <Label>Hiển thị Logo Bộ Công Thương</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 h-fit">
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Preview Footer
                </CardTitle>
                <Badge variant="outline" className="bg-white">
                  Real-time
                </Badge>
              </div>
              <CardDescription>
                Xem trước footer sẽ hiển thị như thế nào trên website
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gray-50 p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {/* Footer Preview */}
                <footer className="bg-gradient-to-br from-blue-600 to-blue-500 text-white py-8 px-4 rounded-lg shadow-lg">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
                    {/* Company Section */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      {footer.company.logo ? (
                        <img
                          src={footer.company.logo}
                          alt={footer.company.name}
                          className="h-12 mb-4"
                        />
                      ) : (
                        <h3 className="text-3xl font-extrabold text-white mb-4 tracking-wider">
                          {footer.company.name || "Company Name"}
                        </h3>
                      )}
                      <p className="text-blue-100 text-sm leading-relaxed mb-4">
                        {footer.company.description || "Company description"}
                      </p>
                      <div className="flex space-x-4">
                        {footer.socialMedia
                          .filter((sm) => sm.enabled && sm.url)
                          .map((sm) => {
                            const Icon = getSocialIcon(sm.platform);
                            return (
                              <a
                                key={sm.platform}
                                href={sm.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-200 hover:text-white transition duration-200 transform hover:scale-110"
                              >
                                <Icon className="w-5 h-5" />
                              </a>
                            );
                          })}
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-bold text-white mb-4">Liên hệ chúng tôi</h3>
                      <address className="not-italic space-y-2 text-sm">
                        {footer.contact.addressLink ? (
                          <a
                            href={footer.contact.addressLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-200 hover:text-white block"
                          >
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {footer.contact.address || "Address"}
                          </a>
                        ) : (
                          <p className="text-blue-200">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {footer.contact.address || "Address"}
                          </p>
                        )}
                        <p className="text-blue-200">
                          <Mail className="w-4 h-4 inline mr-1" />
                          <a
                            href={`mailto:${footer.contact.email}`}
                            className="hover:text-white"
                          >
                            {footer.contact.email || "email@example.com"}
                          </a>
                        </p>
                        <p className="text-blue-200">
                          <Phone className="w-4 h-4 inline mr-1" />
                          <a
                            href={`tel:${footer.contact.phone}`}
                            className="hover:text-white"
                          >
                            {footer.contact.phone || "Phone"}
                          </a>
                        </p>
                      </address>
                    </div>

                    {/* Quick Links Section */}
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-bold text-white mb-4">Liên kết nhanh</h3>
                      <nav className="flex flex-col space-y-2">
                        {footer.quickLinks
                          .filter((link) => link.visible)
                          .sort((a, b) => a.order - b.order)
                          .map((link) => (
                            <a
                              key={link.id}
                              href={link.href}
                              className="text-blue-200 hover:text-white transition duration-200 text-sm"
                            >
                              {link.label}
                            </a>
                          ))}
                      </nav>
                    </div>

                    {/* Company Info Section */}
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-bold text-white mb-4">
                        {footer.companyInfo.companyName || "Company Name"}
                      </h3>
                      <p className="text-sm font-semibold mb-2">
                        Mã Số Thuế: {footer.companyInfo.taxCode || "Tax Code"}
                      </p>
                      <p className="text-sm italic text-blue-100">
                        {footer.companyInfo.managedBy || "Managed by"}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="mt-8 pt-6 border-t border-blue-700 text-center">
                    <p className="text-sm font-semibold mb-2">{footer.copyright}</p>
                    {footer.certifications.dmcaUrl && (
                      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        {footer.certifications.showAnToan && (
                          <div className="text-xs text-blue-200">An Toàn Badge</div>
                        )}
                        {footer.certifications.showTgBct && (
                          <div className="text-xs text-blue-200">Bộ Công Thương</div>
                        )}
                      </div>
                    )}
                  </div>
                </footer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

