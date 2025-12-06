import { NewsArticle } from "@/types/news";

export const MOCK_ARTICLES: NewsArticle[] = [
  {
    _id: "1",
    title: "Vải Thiều Vĩnh Lập - Hương Vị Độc Bản Không Nơi Nào Có",
    slug: "vai-thieu-vinh-lap-huong-vi-doc-ban",
    excerpt: "Vĩnh Lập, Thanh Hà, Hải Dương - cái nôi của vải thiều với hương vị đặc trưng không thể tìm thấy ở bất kỳ đâu. Khám phá bí mật đằng sau hương vị độc đáo này.",
    content: "",
    contentBlocks: [
      {
        type: "p",
        content: "Vĩnh Lập, một vùng đất nhỏ bé nằm ở Thanh Hà, Hải Dương, nhưng lại sở hữu một kho báu vô giá - cây vải thiều với hương vị độc bản không nơi nào có. Đây không chỉ là một loại trái cây, mà còn là niềm tự hào của người dân nơi đây, là câu chuyện về sự kiên trì, tâm huyết và tình yêu với quê hương."
      },
      {
        type: "h2",
        id: "vi-sao-vinh-lap",
        content: "1. Vì Sao Vĩnh Lập Lại Đặc Biệt?"
      },
      {
        type: "p",
        content: "Vĩnh Lập được thiên nhiên ưu đãi với điều kiện địa lý và khí hậu hoàn hảo cho việc trồng vải thiều. Vùng đất này có đặc điểm:"
      },
      {
        type: "ul",
        content: [
          "Đất phù sa màu mỡ được bồi đắp bởi hệ thống sông nước dày đặc",
          "Khí hậu nhiệt đới gió mùa với mùa hè nóng ẩm, mùa đông lạnh khô - điều kiện lý tưởng cho vải thiều tích lũy đường",
          "Vị trí địa lý đặc biệt tạo nên vi khí hậu riêng biệt",
          "Nguồn nước ngầm sạch, giàu khoáng chất"
        ]
      },
      {
        type: "h2",
        id: "huong-vi-doc-dao",
        content: "2. Hương Vị Độc Đáo Của Vải Thiều Vĩnh Lập"
      },
      {
        type: "p",
        content: "Vải thiều Vĩnh Lập có hương vị đặc trưng mà không nơi nào có được. Khi cắn vào, bạn sẽ cảm nhận được:"
      },
      {
        type: "quote",
        content: "Vị ngọt thanh mát, không gắt, không chua. Thịt quả dày, giòn, mọng nước. Hương thơm đặc trưng lan tỏa ngay khi bóc vỏ. Đây chính là hương vị của quê hương, hương vị của tình yêu và niềm tự hào."
      },
      {
        type: "h3",
        id: "thanh-phan-dinh-duong",
        content: "Thành Phần Dinh Dưỡng Vượt Trội"
      },
      {
        type: "p",
        content: "Vải thiều Vĩnh Lập không chỉ ngon mà còn rất bổ dưỡng. Mỗi 100g vải thiều chứa:"
      },
      {
        type: "ul",
        content: [
          "66 calo năng lượng",
          "16.5g đường tự nhiên",
          "71.5mg Vitamin C (chiếm 80% nhu cầu hàng ngày)",
          "Chất xơ, kali, đồng và các chất chống oxy hóa"
        ]
      },
      {
        type: "h2",
        id: "quy-trinh-can-tac",
        content: "3. Quy Trình Canh Tác Chuẩn Nhật Bản"
      },
      {
        type: "p",
        content: "LALA-LYCHEEE áp dụng quy trình canh tác chuẩn Nhật Bản để đảm bảo chất lượng tối đa:"
      },
      {
        type: "ul",
        content: [
          "Chọn giống vải thiều thuần chủng, không lai tạp",
          "Chăm sóc thủ công, tỉa cành, bón phân hữu cơ",
          "Thu hoạch đúng độ chín, không ép chín bằng hóa chất",
          "Bảo quản lạnh ngay sau thu hoạch để giữ độ tươi ngon"
        ]
      },
      {
        type: "img",
        src: "https://images.unsplash.com/photo-1596549925433-e794939a9c43?auto=format&fit=crop&q=80&w=1000",
        caption: "Vườn vải thiều Vĩnh Lập - Nơi tạo nên hương vị độc bản"
      },
      {
        type: "h2",
        id: "ket-luan",
        content: "4. Kết Luận"
      },
      {
        type: "p",
        content: "Vải thiều Vĩnh Lập không chỉ là một sản phẩm nông nghiệp, mà còn là biểu tượng của tình yêu quê hương, của sự kiên trì và tâm huyết. LALA-LYCHEEE tự hào mang hương vị độc bản này đến với thế giới, để mọi người đều có thể cảm nhận được vẻ đẹp và giá trị của vùng đất Vĩnh Lập."
      }
    ],
    coverImage: "https://images.unsplash.com/photo-1596549925433-e794939a9c43?auto=format&fit=crop&q=80&w=1000",
    category: "Sản phẩm & Chất lượng",
    tags: ["Vải thiều Vĩnh Lập", "Thanh Hà", "Hương vị độc bản", "Nông sản sạch"],
    authorName: "LALA-LYCHEEE Team",
    authorRole: "Ban Truyền thông",
    readTime: "5 phút đọc",
    locale: "vi",
    status: "published",
    isFeatured: true,
    views: 1520,
    publishedAt: new Date("2024-11-20").toISOString(),
    createdAt: new Date("2024-11-20").toISOString(),
    updatedAt: new Date("2024-11-20").toISOString(),
  },
  {
    _id: "2",
    title: "Công Nghệ Bảo Quản Lạnh Sâu - Giữ Trọn Hương Vị Vải Thiều Tươi Ngon",
    slug: "cong-nghe-bao-quan-lanh-sau-vai-thieu",
    excerpt: "Khám phá công nghệ bảo quản lạnh sâu tiên tiến của LALA-LYCHEEE, giúp vải thiều giữ được độ tươi ngon và hương vị như vừa hái từ cây trong suốt hành trình từ Vĩnh Lập đến tay người tiêu dùng.",
    content: "",
    contentBlocks: [
      {
        type: "p",
        content: "Một trong những thách thức lớn nhất trong việc xuất khẩu vải thiều là làm sao giữ được độ tươi ngon và hương vị đặc trưng từ khi thu hoạch đến khi đến tay người tiêu dùng. LALA-LYCHEEE đã đầu tư và áp dụng công nghệ bảo quản lạnh sâu tiên tiến để giải quyết vấn đề này."
      },
      {
        type: "h2",
        id: "thach-thuc-bao-quan",
        content: "1. Thách Thức Trong Bảo Quản Vải Thiều"
      },
      {
        type: "p",
        content: "Vải thiều là loại trái cây rất nhạy cảm, dễ bị hư hỏng nếu không được bảo quản đúng cách:"
      },
      {
        type: "ul",
        content: [
          "Vỏ mỏng, dễ bị dập nát trong quá trình vận chuyển",
          "Hàm lượng nước cao (khoảng 82%) khiến trái dễ bị mất nước và héo",
          "Enzyme trong vải thiều hoạt động mạnh, làm giảm chất lượng nhanh chóng",
          "Dễ bị nhiễm khuẩn và nấm mốc nếu không được xử lý đúng cách"
        ]
      },
      {
        type: "h2",
        id: "cong-nghe-lanh-sau",
        content: "2. Công Nghệ Bảo Quản Lạnh Sâu Của LALA-LYCHEEE"
      },
      {
        type: "p",
        content: "LALA-LYCHEEE áp dụng quy trình bảo quản lạnh sâu 4 bước:"
      },
      {
        type: "h3",
        id: "buoc-1",
        content: "Bước 1: Làm Lạnh Nhanh (Rapid Cooling)"
      },
      {
        type: "p",
        content: "Ngay sau khi thu hoạch, vải thiều được đưa vào phòng làm lạnh nhanh với nhiệt độ -2°C đến 0°C trong vòng 2-4 giờ. Điều này giúp:"
      },
      {
        type: "ul",
        content: [
          "Ngăn chặn quá trình chín tiếp diễn",
          "Giảm thiểu sự mất nước",
          "Ức chế hoạt động của enzyme",
          "Giữ nguyên màu sắc và hương vị"
        ]
      },
      {
        type: "h3",
        id: "buoc-2",
        content: "Bước 2: Đóng Gói Chân Không"
      },
      {
        type: "p",
        content: "Vải thiều được đóng gói trong túi chân không với môi trường khí bảo quản đặc biệt (MAP - Modified Atmosphere Packaging), giúp:"
      },
      {
        type: "ul",
        content: [
          "Giảm hàm lượng oxy xuống dưới 5%",
          "Tăng hàm lượng CO2 lên 10-15%",
          "Ức chế sự phát triển của vi khuẩn và nấm mốc",
          "Kéo dài thời gian bảo quản lên đến 30-45 ngày"
        ]
      },
      {
        type: "h3",
        id: "buoc-3",
        content: "Bước 3: Bảo Quản Lạnh Sâu"
      },
      {
        type: "p",
        content: "Sản phẩm được bảo quản trong kho lạnh với nhiệt độ ổn định -1°C đến 0°C và độ ẩm 90-95%, đảm bảo:"
      },
      {
        type: "ul",
        content: [
          "Nhiệt độ được kiểm soát chính xác bằng hệ thống tự động",
          "Độ ẩm tối ưu để tránh mất nước",
          "Hệ thống thông gió đảm bảo không khí lưu thông",
          "Giám sát 24/7 bằng cảm biến IoT"
        ]
      },
      {
        type: "h3",
        id: "buoc-4",
        content: "Bước 4: Vận Chuyển Lạnh"
      },
      {
        type: "p",
        content: "Trong quá trình vận chuyển, vải thiều được giữ trong xe tải lạnh với chuỗi lạnh không đứt đoạn (Cold Chain), đảm bảo nhiệt độ luôn được duy trì."
      },
      {
        type: "img",
        src: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=1000",
        caption: "Hệ thống bảo quản lạnh sâu hiện đại của LALA-LYCHEEE"
      },
      {
        type: "h2",
        id: "loi-ich",
        content: "3. Lợi Ích Của Công Nghệ Bảo Quản Lạnh Sâu"
      },
      {
        type: "p",
        content: "Nhờ công nghệ này, LALA-LYCHEEE có thể:"
      },
      {
        type: "ul",
        content: [
          "Xuất khẩu vải thiều đến các thị trường xa như Nhật Bản, Hàn Quốc, EU",
          "Đảm bảo chất lượng sản phẩm luôn ở mức cao nhất",
          "Giảm thiểu tổn thất sau thu hoạch từ 30% xuống còn dưới 5%",
          "Mở rộng thời gian bán hàng, không còn phụ thuộc vào mùa vụ ngắn ngủi"
        ]
      },
      {
        type: "h2",
        id: "ket-luan-2",
        content: "4. Kết Luận"
      },
      {
        type: "p",
        content: "Công nghệ bảo quản lạnh sâu là một trong những yếu tố quan trọng giúp LALA-LYCHEEE mang hương vị vải thiều Vĩnh Lập đến với thế giới. Đây không chỉ là một kỹ thuật, mà còn là cam kết của chúng tôi trong việc đảm bảo chất lượng và trải nghiệm tốt nhất cho khách hàng."
      }
    ],
    coverImage: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=1000",
    category: "Công nghệ & Bảo quản",
    tags: ["Bảo quản lạnh", "Công nghệ", "Chuỗi lạnh", "Xuất khẩu"],
    authorName: "LALA-LYCHEEE Team",
    authorRole: "Ban Kỹ thuật",
    readTime: "6 phút đọc",
    locale: "vi",
    status: "published",
    isFeatured: false,
    views: 980,
    publishedAt: new Date("2024-11-18").toISOString(),
    createdAt: new Date("2024-11-18").toISOString(),
    updatedAt: new Date("2024-11-18").toISOString(),
  },
 
];
