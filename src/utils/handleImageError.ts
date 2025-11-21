export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>
) => {
  const target = e.target as HTMLImageElement;
  target.onerror = null; // Prevent infinite loop if placeholder fails
  target.src = `https://placehold.co/600x400/fecdd3/44403c?text=Lỗi+Tải+Ảnh`;
};
