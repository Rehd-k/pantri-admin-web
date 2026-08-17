"use client";

import { useParams } from "next/navigation";
import { PackageForm } from "@/components/cms/PackageForm";

export default function EditPackagePage() {
  const { id } = useParams<{ id: string }>();
  return <PackageForm packageId={id} />;
}
