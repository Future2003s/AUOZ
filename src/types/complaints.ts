export interface ComplaintStep {
  title: string;
  description?: string;
}

export interface ComplaintSettings {
  heroTitle: string;
  heroSubtitle: string;
  processTitle: string;
  processDescription: string;
  steps: ComplaintStep[];
  hotlineLabel: string;
  hotlineNumber: string;
  hotlineHours: string;
  email: string;
  emailNote: string;
  guaranteeText: string;
  updatedAt?: string;
}

export const defaultComplaintSettings: ComplaintSettings = {
  heroTitle: "Giải Quyết Khiếu Nại",
  heroSubtitle:
    "Chúng tôi luôn sẵn sàng lắng nghe và xử lý tận tâm trong vòng 24h làm việc.",
  processTitle: "Quy trình tiếp nhận & xử lý",
  processDescription: "Mọi khiếu nại được ghi nhận và xử lý minh bạch qua 4 bước.",
  steps: [
    {
      title: "Tiếp nhận & xác thực",
      description:
        "Kiểm tra thông tin đơn hàng và xác thực yêu cầu của khách hàng.",
    },
    {
      title: "Liên hệ & làm rõ",
      description:
        "Trong vòng 24h, bộ phận CSKH sẽ liên hệ để trao đổi chi tiết và đề xuất phương án xử lý.",
    },
    {
      title: "Xử lý & phản hồi",
      description:
        "Tiến hành bồi hoàn, đổi trả hoặc hỗ trợ kỹ thuật theo thỏa thuận với khách hàng.",
    },
    {
      title: "Hoàn tất & ghi nhận",
      description:
        "Gửi biên bản hoàn tất khiếu nại và ghi nhận phản hồi cuối cùng.",
    },
  ],
  hotlineLabel: "Hotline hỗ trợ",
  hotlineNumber: "(+84) 0962-215-666",
  hotlineHours: "08:00 – 20:00 (T2 – CN)",
  email: "claim@lalalychee.com",
  emailNote: "Hỗ trợ 24/7 qua email, phản hồi <24h",
  guaranteeText:
    "Toàn bộ khiếu nại được bảo mật theo chính sách dữ liệu của LALA-LYCHEEE.",
};


