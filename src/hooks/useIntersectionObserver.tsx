import { useEffect, useRef, useState } from "react";

export const useIntersectionObserver = (
  options: IntersectionObserverInit & { triggerOnce?: boolean }
) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const { threshold, root, rootMargin, triggerOnce } = options;

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && triggerOnce) {
          observer.current?.unobserve(entry.target);
        }
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );

    const { current: currentObserver } = observer;
    if (node) currentObserver.observe(node);

    return () => currentObserver.disconnect();
  }, [node, threshold, root, rootMargin, triggerOnce]);

  return [setNode, entry] as const;
};
