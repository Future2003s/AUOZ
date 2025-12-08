"use client";
import { useMemo, useState } from "react";
import { useMe } from "./useMe";
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "./useAddresses";
import type { Address } from "@/hooks/useAddresses";
import { useOrders } from "./useOrders";
import { useUploadAvatar } from "./useAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ButtonLoader } from "@/components/ui/loader";
import { useRealtimeUser } from "@/hooks/useRealtimeUser";
import { useAuth } from "@/hooks/useAuth";
import { useOrderEvents } from "@/hooks/useOrderEvents";
import {
  Edit,
  Trash2,
  MapPin,
  Plus,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  Truck,
  Home,
  Building2,
  MapPinned,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Settings,
  ShoppingBag,
  CreditCard,
  Bell,
  Globe,
  ChevronRight,
  Star,
  TrendingUp,
  Wallet,
  Heart,
  Camera,
} from "lucide-react";
import Image from "next/image";

// Backend user profile type
type BackendUserProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  addresses: string[];
  preferences: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
};

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "??";
};

type AddressFormData = {
  type: "home" | "work" | "other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  provinceOld?: string;
  districtOld?: string;
  wardOld?: string;
  provinceNew?: string;
  wardNew?: string;
};

type TabType = "overview" | "addresses" | "orders" | "settings";

export default function ProfilePage() {
  // const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, error } = useMe();
  const { isAuthenticated } = useAuth();
  const hasRedirectedRef = useRef(false);
  const hasShownToastRef = useRef(false);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const {
    data: orders = [],
    isLoading: ordersLoading,
  } = useOrders(orderStatusFilter as any, { enabled: isAuthenticated });
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Address management
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    type: "home",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Việt Nam",
    provinceOld: "",
    districtOld: "",
    wardOld: "",
    provinceNew: "",
    wardNew: "",
  });

  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();
  const uploadAvatarMutation = useUploadAvatar();

  // Enable realtime user updates
  useRealtimeUser(isAuthenticated);
  useOrderEvents(isAuthenticated);

  // Extract user data from backend response
  const me = useMemo(() => {
    if (data?.success && data.user) {
      return data.user as BackendUserProfile;
    }
    return null;
  }, [data]);

  // Handle authentication errors
  useEffect(() => {
    if (error && !hasShownToastRef.current) {
      if (error.message === "No authentication token found") {
        hasShownToastRef.current = true;
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
        toast.error("Vui lòng đăng nhập để xem trang cá nhân");
          // Extract locale from pathname
          const locale = pathname.split('/')[1] || 'vi';
          const currentPath = pathname || `/${locale}/me`;
          router.push(`/${locale}/login?reason=login_required&redirect=${encodeURIComponent(currentPath)}`);
        }
      } else {
        hasShownToastRef.current = true;
        toast.error("Có lỗi xảy ra khi tải thông tin cá nhân");
      }
    }
  }, [error, router, pathname]);

  // Redirect to login if no user data and not loading
  useEffect(() => {
    // Only redirect if we're sure there's no user and not loading
    // Also check that we're not already on login page
    const isOnLoginPage = pathname?.includes('/login');
    
    if (!isLoading && !me && !error && !hasRedirectedRef.current && !isOnLoginPage) {
      // Check if data exists but user is null (meaning no auth)
      const hasNoAuth = data?.success && !data?.user;
      
      if (hasNoAuth) {
      const timer = setTimeout(() => {
          // Double check before redirecting
          if (!me && !hasRedirectedRef.current && !pathname?.includes('/login')) {
            hasRedirectedRef.current = true;
            if (!hasShownToastRef.current) {
              hasShownToastRef.current = true;
          toast.error("Vui lòng đăng nhập để xem trang cá nhân");
            }
            const locale = pathname.split('/')[1] || 'vi';
            const currentPath = pathname || `/${locale}/me`;
            router.push(`/${locale}/login?reason=login_required&redirect=${encodeURIComponent(currentPath)}`);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    }
    
    // Reset refs if user becomes available (e.g., after login)
    if (me && (hasRedirectedRef.current || hasShownToastRef.current)) {
      hasRedirectedRef.current = false;
      hasShownToastRef.current = false;
    }
  }, [isLoading, me, error, router, data, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  if (!me && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">
            Đang kiểm tra đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  if (!me) {
    return null;
  }

  const fullName = `${me.firstName} ${me.lastName}`.trim();

  // Avatar upload handler
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Kích thước file quá lớn. Tối đa 5MB");
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      toast.success("Cập nhật avatar thành công");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Có lỗi xảy ra khi upload avatar");
    } finally {
      // Reset input
      event.target.value = "";
    }
  };

  // Address handlers
  const handleOpenAddAddress = () => {
    setSelectedAddress(null);
    setAddressForm({
      type: "home",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Việt Nam",
      provinceOld: "",
      districtOld: "",
      wardOld: "",
      provinceNew: "",
      wardNew: "",
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (address: Address) => {
    setSelectedAddress(address);
    setAddressForm({
      type: address.type || "home",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country || "Việt Nam",
      isDefault: address.isDefault,
      provinceOld: address.provinceOld || "",
      districtOld: address.districtOld || "",
      wardOld: address.wardOld || "",
      provinceNew: address.provinceNew || "",
      wardNew: address.wardNew || "",
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    const errors: string[] = [];
    if (!addressForm.type) errors.push("Loại địa chỉ");
    if (!addressForm.street?.trim()) errors.push("Đường/Phố");
    if (!addressForm.city?.trim()) errors.push("Thành phố/Tỉnh");
    if (!addressForm.state?.trim()) errors.push("Quận/Huyện");
    if (!addressForm.zipCode?.trim()) errors.push("Mã bưu điện");
    if (!addressForm.country?.trim()) errors.push("Quốc gia");

    if (errors.length > 0) {
      toast.error(`Vui lòng điền đầy đủ: ${errors.join(", ")}`);
      return;
    }

    try {
      if (selectedAddress) {
        const addressId = selectedAddress._id ?? selectedAddress.id;
        if (!addressId) {
          toast.error("Không xác định được địa chỉ cần cập nhật");
          return;
        }

        await updateAddressMutation.mutateAsync({
          addressId,
          addressData: addressForm,
        });
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await addAddressMutation.mutateAsync(addressForm);
        toast.success("Thêm địa chỉ thành công");
      }
      setIsAddressModalOpen(false);
      setSelectedAddress(null);
      setAddressForm({
        type: "home",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Việt Nam",
        provinceOld: "",
        districtOld: "",
        wardOld: "",
        provinceNew: "",
        wardNew: "",
      });
    } catch (error: any) {
      console.error("Save address error:", error);
      const errorMessage =
        error?.message || error?.error || "Có lỗi xảy ra khi lưu địa chỉ";
      toast.error(errorMessage);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      return;
    }

    try {
      await deleteAddressMutation.mutateAsync(addressId);
      toast.success("Xóa địa chỉ thành công");
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddressMutation.mutateAsync(addressId);
      toast.success("Đã đặt làm địa chỉ mặc định");
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  // Order status helpers
  const getOrderStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
        color: string;
      }
    > = {
      pending: {
        label: "Chờ xử lý",
        variant: "outline",
        icon: Clock,
        color: "text-amber-600 bg-amber-50 border-amber-200",
      },
      processing: {
        label: "Đang xử lý",
        variant: "default",
        icon: Package,
        color: "text-blue-600 bg-blue-50 border-blue-200",
      },
      shipped: {
        label: "Đang giao",
        variant: "default",
        icon: Truck,
        color: "text-purple-600 bg-purple-50 border-purple-200",
      },
      delivered: {
        label: "Giao thành công",
        variant: "default",
        icon: CheckCircle2,
        color: "text-green-600 bg-green-50 border-green-200",
      },
      cancelled: {
        label: "Đã hủy",
        variant: "destructive",
        icon: XCircle,
        color: "text-red-600 bg-red-50 border-red-200",
      },
      refunded: {
        label: "Đã hoàn tiền",
        variant: "secondary",
        icon: XCircle,
        color: "text-gray-600 bg-gray-50 border-gray-200",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      variant: "outline" as const,
      icon: Package,
      color: "text-gray-600 bg-gray-50 border-gray-200",
    };
    const Icon = statusInfo.icon;

    return (
      <Badge
        className={`flex items-center gap-1.5 w-fit px-3 py-1 ${statusInfo.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{statusInfo.label}</span>
      </Badge>
    );
  };

  const getOrderItemDisplay = (item: any) => {
    const quantity = Number(item?.quantity || 0);
    const image =
      item?.product?.images?.[0]?.url || item?.image || null;
    const name = item?.product?.name || item?.name || "Sản phẩm";
    const basePrice =
      item?.price ??
      item?.product?.salePrice ??
      item?.product?.price ??
      (item?.subtotal && quantity ? item.subtotal / quantity : undefined) ??
      0;
    const subtotal =
      item?.subtotal ??
      (quantity ? basePrice * quantity : basePrice) ??
      basePrice;

    return {
      name,
      image,
      price: basePrice,
      subtotal,
      quantity,
      hasImage: Boolean(image),
    };
  };

  const getOrderBreakdown = (order: any) => {
    const subtotal =
      order?.subtotal ??
      order?.items?.reduce(
        (sum: number, item: any) =>
          sum + (Number(item?.price ?? item?.product?.salePrice ?? item?.product?.price ?? 0) * Number(item?.quantity ?? 0)),
        0
      ) ??
      0;
    const shipping =
      order?.shippingCost ??
      (typeof order?.total === "number" ? order.total - subtotal : 0);
    const discount = order?.discount ?? 0;
    const tax = order?.tax ?? 0;
    const total =
      order?.total ?? subtotal + shipping + tax - discount;

    return { subtotal, shipping, discount, tax, total };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate stats
  const totalSpent = orders.reduce(
    (sum, order: any) => sum + (order.total || 0),
    0
  );
  const deliveredOrders = orders.filter(
    (o: any) => o.status === "delivered"
  ).length;
  const pendingOrders = orders.filter(
    (o: any) => o.status === "pending" || o.status === "processing"
  ).length;

  const tabs = [
    {
      id: "overview" as TabType,
      label: "Tổng quan",
      icon: User,
    },
    {
      id: "addresses" as TabType,
      label: "Địa chỉ",
      icon: MapPin,
      badge: addresses.length,
    },
    {
      id: "orders" as TabType,
      label: "Đơn hàng",
      icon: ShoppingBag,
      badge: orders.length,
    },
    {
      id: "settings" as TabType,
      label: "Cài đặt",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 mt-25">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm sticky top-8">
              <CardContent className="p-6">
                {/* User Profile Card */}
                <div className="text-center mb-6 pb-6 border-b border-slate-200">
                  <div className="relative inline-block mb-4 group">
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer relative block"
                    >
                      {me.avatar ? (
                        <img
                          src={me.avatar}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100 shadow-lg transition-opacity group-hover:opacity-80"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-blue-100 shadow-lg transition-opacity group-hover:opacity-80">
                          {getInitials(me.firstName, me.lastName, me.email)}
                        </div>
                      )}
                      {/* Upload overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploadAvatarMutation.isPending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadAvatarMutation.isPending}
                    />
                    {me.isEmailVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 ring-2 ring-white z-10">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {fullName || "Chưa có tên"}
                  </h2>
                  <p className="text-sm text-slate-500 mb-2">{me.email}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {me.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        {tab.badge !== undefined && (
                          <Badge
                            variant="secondary"
                            className={
                              isActive
                                ? "bg-white/20 text-white border-white/30"
                                : "bg-slate-200 text-slate-700"
                            }
                          >
                            {tab.badge}
                          </Badge>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm mb-1">
                            Tổng đơn hàng
                          </p>
                          <p className="text-3xl font-bold">{orders.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm mb-1">Đã giao</p>
                          <p className="text-3xl font-bold">
                            {deliveredOrders}
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-amber-100 text-sm mb-1">
                            Đang xử lý
                          </p>
                          <p className="text-3xl font-bold">{pendingOrders}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Clock className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm mb-1">
                            Tổng chi tiêu
                          </p>
                          <p className="text-xl font-bold">
                            {formatCurrency(totalSpent).replace("₫", "")}₫
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Wallet className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Information */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-5 w-5 text-blue-600" />
                      Thông tin cá nhân
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Họ
                        </Label>
                        <Input
                          value={me.firstName}
                          readOnly
                          className="bg-slate-50 border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Tên
                        </Label>
                        <Input
                          value={me.lastName}
                          readOnly
                          className="bg-slate-50 border-slate-200"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <Input
                          value={me.email}
                          readOnly
                          className="bg-slate-50 border-slate-200"
                        />
                      </div>
                      {me.phone && (
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Số điện thoại
                          </Label>
                          <Input
                            value={me.phone}
                            readOnly
                            className="bg-slate-50 border-slate-200"
                          />
                        </div>
                      )}
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Thành viên từ
                        </Label>
                        <Input
                          value={new Date(me.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                          readOnly
                          className="bg-slate-50 border-slate-200"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <MapPin className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Quản lý địa chỉ
                            </p>
                            <p className="text-sm text-slate-500">
                              {addresses.length} địa chỉ đã lưu
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                            <ShoppingBag className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Xem đơn hàng
                            </p>
                            <p className="text-sm text-slate-500">
                              {orders.length} đơn hàng
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Địa chỉ của tôi
                    </CardTitle>
                    <Button
                      onClick={handleOpenAddAddress}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm địa chỉ
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {addressesLoading ? (
                      <div className="text-center py-12">
                        <ButtonLoader size="md" />
                        <p className="mt-4 text-slate-500">
                          Đang tải địa chỉ...
                        </p>
                      </div>
                    ) : addresses && addresses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address: any) => {
                          const addressId = address._id || address.id;
                          const Icon =
                            address.type === "home"
                              ? Home
                              : address.type === "work"
                              ? Building2
                              : MapPinned;
                          return (
                            <Card
                              key={addressId}
                              className="border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] group"
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                      <Icon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 capitalize">
                                        {address.type === "home"
                                          ? "Nhà riêng"
                                          : address.type === "work"
                                          ? "Cơ quan"
                                          : "Khác"}
                                      </p>
                                      {address.isDefault && (
                                        <Badge className="mt-1 bg-blue-600 text-white text-xs">
                                          Mặc định
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600 mb-4">
                                  <p className="font-medium">
                                    {address.street}
                                  </p>
                                  <p>
                                    {address.city}, {address.state}{" "}
                                    {address.zipCode}
                                  </p>
                                  <p>{address.country}</p>
                                  {(address.provinceOld ||
                                    address.districtOld ||
                                    address.wardOld) && (
                                    <div className="pt-2 mt-2 border-t border-slate-200">
                                      <p className="text-xs font-medium text-slate-500 mb-1">
                                        Địa chỉ hành chính cũ:
                                      </p>
                                      <p className="text-xs">
                                        {[
                                          address.wardOld,
                                          address.districtOld,
                                          address.provinceOld,
                                        ]
                                          .filter(Boolean)
                                          .join(", ") || "Chưa có"}
                                      </p>
                                    </div>
                                  )}
                                  {(address.provinceNew || address.wardNew) && (
                                    <div className="pt-2 mt-2 border-t border-slate-200">
                                      <p className="text-xs font-medium text-blue-600 mb-1">
                                        Địa chỉ hành chính mới:
                                      </p>
                                      <p className="text-xs">
                                        {[address.wardNew, address.provinceNew]
                                          .filter(Boolean)
                                          .join(", ") || "Chưa có"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                                  {!address.isDefault && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleSetDefaultAddress(addressId)
                                      }
                                      className="flex-1"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Đặt mặc định
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenEditAddress(address)
                                    }
                                    className="flex-1"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteAddress(addressId)
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                          <MapPin className="h-10 w-10 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">
                          Chưa có địa chỉ
                        </h4>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                          Thêm địa chỉ giao hàng để dễ dàng mua sắm và nhận hàng
                          nhanh chóng
                        </p>
                        <Button
                          onClick={handleOpenAddAddress}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm địa chỉ mới
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                      Lịch sử đơn hàng
                    </CardTitle>
                    <Select
                      value={orderStatusFilter}
                      onValueChange={setOrderStatusFilter}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả đơn hàng</SelectItem>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="processing">Đang xử lý</SelectItem>
                        <SelectItem value="shipped">Đang giao</SelectItem>
                        <SelectItem value="delivered">
                          Giao thành công
                        </SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="text-center py-12">
                        <ButtonLoader size="md" />
                        <p className="mt-4 text-slate-500">
                          Đang tải đơn hàng...
                        </p>
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order: any) => {
                          const orderId = order._id || order.id;
                          const breakdown = getOrderBreakdown(order);
                          return (
                            <Card
                              key={orderId}
                              className="border-0 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.01]"
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-lg text-slate-900">
                                          Đơn hàng #
                                          {order.orderNumber ||
                                            orderId.slice(-8).toUpperCase()}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                          {formatDate(order.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="ml-12 mb-3">
                                      {getOrderStatusBadge(order.status)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600 mb-1">
                                      {formatCurrency(order.total || 0)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {order.items?.length || 0} sản phẩm
                                    </p>
                                  </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4 mt-4 space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Tạm tính</span>
                                    <span className="font-semibold text-slate-900">
                                      {formatCurrency(breakdown.subtotal || 0)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Phí giao hàng</span>
                                    <span className="font-semibold text-slate-900">
                                      {breakdown.shipping && breakdown.shipping > 0
                                        ? formatCurrency(breakdown.shipping)
                                        : "Miễn phí"}
                                    </span>
                                  </div>
                                  {breakdown.discount > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Giảm giá</span>
                                      <span className="font-semibold text-emerald-600">
                                        -{formatCurrency(breakdown.discount)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-base font-bold text-blue-600 pt-2 border-t border-dashed border-slate-200">
                                    <span>Tổng thanh toán</span>
                                    <span>{formatCurrency(breakdown.total || 0)}</span>
                                  </div>
                                </div>

                                {order.items && order.items.length > 0 && (
                                  <div className="border-t border-slate-200 pt-4 mt-4">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">
                                      Sản phẩm
                                    </p>
                                    <div className="space-y-3">
                                      {order.items
                                        .slice(0, 3)
                                        .map((item: any, idx: number) => {
                                          const display = getOrderItemDisplay(
                                            item
                                          );
                                          return (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                                            >
                                              <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                                                {display.hasImage ? (
                                                  <Image
                                                    width={100}
                                                    height={100}
                                                    src={display.image as string}
                                                    alt={display.name}
                                                    className="w-full h-full object-cover"
                                                  />
                                                ) : (
                                                  <Package className="h-6 w-6 text-slate-400" />
                                                )}
                                              </div>
                                              <div className="flex-1">
                                                <p className="font-medium text-slate-900">
                                                  {display.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                  SL: {display.quantity} ×{" "}
                                                  {formatCurrency(
                                                    display.price || 0
                                                  )}
                                                </p>
                                              </div>
                                              <p className="font-semibold text-slate-900">
                                                {formatCurrency(
                                                  display.subtotal || 0
                                                )}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      {order.items.length > 3 && (
                                        <p className="text-sm text-slate-500 text-center pt-2">
                                          +{order.items.length - 3} sản phẩm
                                          khác
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {order.shippingAddress && (
                                  <div className="border-t border-slate-200 pt-4 mt-4">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                      <div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1">
                                          Địa chỉ giao hàng
                                        </p>
                                        <p className="text-sm text-slate-600">
                                          {order.shippingAddress.street},{" "}
                                          {order.shippingAddress.city},{" "}
                                          {order.shippingAddress.state}{" "}
                                          {order.shippingAddress.zipCode}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(order.deliveredAt || order.cancelledAt) && (
                                  <div className="border-t border-slate-200 pt-4 mt-4">
                                    {order.deliveredAt && (
                                      <p className="text-sm text-green-600 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Giao ngày:{" "}
                                        {formatDate(order.deliveredAt)}
                                      </p>
                                    )}
                                    {order.cancelledAt && (
                                      <p className="text-sm text-red-600 flex items-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        Hủy ngày:{" "}
                                        {formatDate(order.cancelledAt)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                          <Package className="h-10 w-10 text-slate-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">
                          {orderStatusFilter !== "all"
                            ? "Không có đơn hàng với trạng thái này"
                            : "Chưa có đơn hàng"}
                        </h4>
                        <p className="text-slate-500 max-w-sm mx-auto">
                          {orderStatusFilter !== "all"
                            ? "Thử chọn trạng thái khác hoặc xem tất cả đơn hàng"
                            : "Bắt đầu mua sắm để xem đơn hàng của bạn ở đây"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Cài đặt tài khoản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Globe className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Ngôn ngữ
                            </p>
                            <p className="text-sm text-slate-500">
                              {me.preferences.language.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Tiền tệ
                            </p>
                            <p className="text-sm text-slate-500">
                              {me.preferences.currency}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Bell className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Thông báo
                            </p>
                            <p className="text-sm text-slate-500">
                              Email:{" "}
                              {me.preferences.notifications.email
                                ? "Bật"
                                : "Tắt"}{" "}
                              • SMS:{" "}
                              {me.preferences.notifications.sms ? "Bật" : "Tắt"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Address Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
            </DialogTitle>
            <DialogDescription>
              {selectedAddress
                ? "Cập nhật thông tin địa chỉ của bạn"
                : "Thêm địa chỉ giao hàng mới để dễ dàng mua sắm"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-type" className="text-sm font-medium">
                    Loại địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={addressForm.type}
                    onValueChange={(value) =>
                      setAddressForm({
                        ...addressForm,
                        type: value as "home" | "work" | "other",
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn loại địa chỉ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          <span>Nhà riêng</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="work">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>Cơ quan</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4" />
                          <span>Khác</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Quốc gia <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        country: e.target.value,
                      })
                    }
                    placeholder="Ví dụ: Việt Nam"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium">
                  Đường/Phố <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="street"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  placeholder="Số nhà, tên đường, ngõ, ngách..."
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Thành phố/Tỉnh <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    placeholder="Ví dụ: Hà Nội"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    Quận/Huyện <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    placeholder="Ví dụ: Quận Ba Đình"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm font-medium">
                  Mã bưu điện <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zipCode"
                  value={addressForm.zipCode}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, zipCode: e.target.value })
                  }
                  placeholder="Ví dụ: 100000"
                  className="h-10"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Tabs cho địa chỉ hành chính cũ và mới */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                Địa chỉ hành chính (Tùy chọn)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Địa chỉ hành chính cũ */}
                <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-slate-600" />
                    <h4 className="font-medium text-sm text-slate-700">
                      Địa chỉ hành chính cũ
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="provinceOld"
                        className="text-xs font-medium text-slate-600"
                      >
                        Tỉnh/Thành phố cũ
                      </Label>
                      <Input
                        id="provinceOld"
                        value={addressForm.provinceOld || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            provinceOld: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Hà Nội"
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="districtOld"
                        className="text-xs font-medium text-slate-600"
                      >
                        Quận/Huyện cũ
                      </Label>
                      <Input
                        id="districtOld"
                        value={addressForm.districtOld || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            districtOld: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Quận Ba Đình"
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="wardOld"
                        className="text-xs font-medium text-slate-600"
                      >
                        Phường/Xã cũ
                      </Label>
                      <Input
                        id="wardOld"
                        value={addressForm.wardOld || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            wardOld: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Phường Điện Biên"
                        className="h-9 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Địa chỉ hành chính mới */}
                <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-sm text-slate-700">
                      Địa chỉ hành chính mới
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="provinceNew"
                        className="text-xs font-medium text-slate-600"
                      >
                        Tỉnh/Thành phố mới
                      </Label>
                      <Input
                        id="provinceNew"
                        value={addressForm.provinceNew || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            provinceNew: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Hà Nội"
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="wardNew"
                        className="text-xs font-medium text-slate-600"
                      >
                        Phường/Xã mới
                      </Label>
                      <Input
                        id="wardNew"
                        value={addressForm.wardNew || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            wardNew: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Phường Điện Biên"
                        className="h-9 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddressModalOpen(false);
                setSelectedAddress(null);
                setAddressForm({
                  type: "home",
                  street: "",
                  city: "",
                  state: "",
                  zipCode: "",
                  country: "Việt Nam",
                  provinceOld: "",
                  districtOld: "",
                  wardOld: "",
                  provinceNew: "",
                  wardNew: "",
                });
              }}
              disabled={
                addAddressMutation.isPending || updateAddressMutation.isPending
              }
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveAddress}
              disabled={
                addAddressMutation.isPending || updateAddressMutation.isPending
              }
              className="min-w-[100px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {addAddressMutation.isPending ||
              updateAddressMutation.isPending ? (
                <>
                  <div className="mr-2">
                    <ButtonLoader size="sm" />
                  </div>
                  <span>Đang lưu...</span>
                </>
              ) : selectedAddress ? (
                "Cập nhật"
              ) : (
                "Thêm địa chỉ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
