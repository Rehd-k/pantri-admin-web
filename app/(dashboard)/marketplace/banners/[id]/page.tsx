"use client";

import { useParams } from "next/navigation";
import { BannerForm } from "@/components/cms/BannerForm";

export default function EditBannerPage() {
  const { id } = useParams<{ id: string }>();
  return <BannerForm bannerId={id} />;
}
