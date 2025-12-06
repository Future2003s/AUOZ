"use client";
import { motion } from "framer-motion";
import { Award, Leaf, Package, Heart, Globe, Shield } from "lucide-react";

interface ValueItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const values: ValueItem[] = [
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "100% Vải Tươi Vĩnh Lập",
    description: "Nguồn gốc rõ ràng từ vùng đất Vĩnh Lập - Thanh Hà, nơi có hương vị độc bản không nơi nào có.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Chất Lượng Quốc Tế",
    description: "Quy trình canh tác chuẩn Nhật Bản, đạt chứng nhận chất lượng và xuất khẩu thành công.",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: <Package className="w-8 h-8" />,
    title: "Đóng Gói Sang Trọng",
    description: "Mỗi sản phẩm được đóng gói tinh xảo, phù hợp làm quà tặng cao cấp.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Tâm Huyết Với Quê Hương",
    description: "Mang lại công ăn việc làm bền vững cho người nông dân, góp phần phát triển địa phương.",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Xuất Khẩu Nhật Bản",
    description: "Được tin dùng tại thị trường Nhật Bản - minh chứng cho chất lượng và uy tín.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Dịch Vụ Tận Tâm",
    description: "Hỗ trợ khách hàng 24/7, giao hàng nhanh chóng, đảm bảo hài lòng 100%.",
    color: "from-purple-500 to-violet-600",
  },
];

export const ValuePropositionSection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-white via-rose-50/30 to-orange-50/30 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-rose-600 font-bold tracking-widest uppercase text-xs mb-3 block">
            Tại Sao Chọn Chúng Tôi
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Giá Trị Cốt Lõi
          </h2>
          <div className="w-20 h-1 bg-rose-600 mx-auto rounded-full mb-6" />
          <p className="text-lg text-slate-600 leading-relaxed">
            Những lý do khiến LALA-LYCHEEE trở thành lựa chọn hàng đầu cho những ai
            yêu thích hương vị tự nhiên và chất lượng cao cấp
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-stone-100 h-full flex flex-col">
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${value.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  {value.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif">
                  {value.title}
                </h3>
                <p className="text-slate-600 leading-relaxed flex-grow">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

