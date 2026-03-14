"use client";
import { useParams } from "next/navigation";
import CmsPostForm from "../../CmsPostForm";

export default function CmsPostEditPage() {
  const params = useParams<{ id: string }>();
  return <CmsPostForm isEdit postId={params?.id} />;
}
