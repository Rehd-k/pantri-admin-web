"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/cms/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return <ProductForm productId={id} />;
}
