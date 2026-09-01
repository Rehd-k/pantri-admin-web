"use client";

import { useParams } from "next/navigation";
import { BlogPostForm } from "@/components/cms/BlogPostForm";

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  return <BlogPostForm postId={id} />;
}
