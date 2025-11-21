import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export const FadeInWhenVisible: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ref, entry] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });
  const isVisible = entry?.isIntersecting;

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {children}
    </div>
  );
};
