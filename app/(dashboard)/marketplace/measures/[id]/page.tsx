"use client";

import { useParams } from "next/navigation";
import { MeasureUnitForm } from "@/components/cms/MeasureUnitForm";

export default function EditMeasureUnitPage() {
  const { id } = useParams<{ id: string }>();
  return <MeasureUnitForm unitId={id} />;
}
