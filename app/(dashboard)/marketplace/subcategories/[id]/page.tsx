"use client";

import { useParams } from "next/navigation";
import { SubcategoryForm } from "@/components/cms/SubcategoryForm";

export default function EditSubcategoryPage() {
  const { id } = useParams<{ id: string }>();
  return <SubcategoryForm subcategoryId={id} />;
}
