"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Save, Search, Share2 } from "lucide-react";
import { toast } from "sonner";

interface SEOSettings {
  site: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    language: string;
  };
  og: {
    siteName: string;
    type: string;
    image: string;
  };
  twitter: {
    card: string;
    site: string;
    creator: string;
  };
  robots: {
    index: boolean;
    follow: boolean;
  };
  sitemap: {
    enabled: boolean;
    url: string;
  };
}

const defaultSEO: SEOSettings = {
  site: {
    title: "LALA-LYCHEEE",
    description: "Vải thiều tươi ngon từ Vĩnh Lập",
    keywords: "vải thiều, lala lychee, trái cây",
    author: "LALA-LYCHEEE",
    language: "vi",
  },
  og: {
    siteName: "LALA-LYCHEEE",
    type: "website",
    image: "/images/og-image.jpg",
  },
  twitter: {
    card: "summary_large_image",
    site: "@lalalychee",
    creator: "@lalalychee",
  },
  robots: {
    index: true,
    follow: true,
  },
  sitemap: {
    enabled: true,
    url: "/sitemap.xml",
  },
};

export default function SEOSettingsPage() {
  const [seo, setSeo] = useState<SEOSettings>(defaultSEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSEOSettings();
  }, []);

  const fetchSEOSettings = async () => {
    try {
      const res = await fetch("/api/cms/seo", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSeo(data?.data || defaultSEO);
      }
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(seo),
      });

      if (res.ok) {
        toast.success("Đã lưu cấu hình SEO thành công!");
      } else {
        toast.error("Không thể lưu cấu hình SEO");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt SEO</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cấu hình SEO, meta tags và social media
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
        </Button>
      </div>

      <Tabs defaultValue="site" className="space-y-4">
        <TabsList>
          <TabsTrigger value="site">Site Info</TabsTrigger>
          <TabsTrigger value="og">Open Graph</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="robots">Robots & Sitemap</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Website</CardTitle>
              <CardDescription>
                Cấu hình thông tin cơ bản của website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(seo.site).map(([key, value]) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  {key === "description" ? (
                    <Textarea
                      value={value}
                      onChange={(e) =>
                        setSeo({
                          ...seo,
                          site: { ...seo.site, [key]: e.target.value },
                        })
                      }
                      rows={3}
                    />
                  ) : (
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setSeo({
                          ...seo,
                          site: { ...seo.site, [key]: e.target.value },
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="og" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph</CardTitle>
              <CardDescription>
                Cấu hình cho Facebook và các mạng xã hội khác
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(seo.og).map(([key, value]) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        og: { ...seo.og, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twitter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twitter Card</CardTitle>
              <CardDescription>
                Cấu hình cho Twitter/X
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(seo.twitter).map(([key, value]) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        twitter: { ...seo.twitter, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Robots & Sitemap</CardTitle>
              <CardDescription>
                Cấu hình robots.txt và sitemap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seo.robots.index}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        robots: { ...seo.robots, index: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <Label>Allow indexing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seo.robots.follow}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        robots: { ...seo.robots, follow: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <Label>Allow following links</Label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seo.sitemap.enabled}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        sitemap: { ...seo.sitemap, enabled: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <Label>Enable sitemap</Label>
                </div>
                <div>
                  <Label>Sitemap URL</Label>
                  <Input
                    type="text"
                    value={seo.sitemap.url}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        sitemap: { ...seo.sitemap, url: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

