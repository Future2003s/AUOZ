"use client";

interface VideoSectionProps {
  videoId?: string;
  title?: string;
  description?: string;
  startTime?: number;
}

export function VideoSection({
  videoId = "zZaav6omxko",
  title = "Vợ chồng Nhật Việt tâm huyết với quả vải Thanh Hà, Hải Dương",
  description = "ライチ農家の日越夫婦、故郷タインハーに貢献",
  startTime = 337,
}: VideoSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Câu chuyện của chúng tôi
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?si=U3j4-k-TxjhVtPDO&start=${startTime}&autoplay=0&rel=0`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-700 font-medium">{title}</p>
        </div>
      </div>
    </section>
  );
}

